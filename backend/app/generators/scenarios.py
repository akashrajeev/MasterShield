from __future__ import annotations

import numpy as np
import pandas as pd

from .transaction import generate_transactions
from ..identify.catalog import load_attacks

PROFILES: dict[str, dict[str, float]] = {
    "identity": {"behavioral": .28, "merchant": .18, "beneficiary": .35, "device": .88, "velocity": 1.10, "geo": 1.25, "content": .10},
    "social": {"behavioral": .42, "merchant": .12, "beneficiary": .48, "device": .95, "velocity": 1.20, "geo": 1.10, "content": .78},
    "ato": {"behavioral": .58, "merchant": .10, "beneficiary": .72, "device": .58, "velocity": 1.55, "geo": 2.0, "content": .35},
    "merchant": {"behavioral": .26, "merchant": .58, "beneficiary": .28, "device": .90, "velocity": 1.35, "geo": 1.15, "content": .30},
    "transaction": {"behavioral": .46, "merchant": .18, "beneficiary": .42, "device": .96, "velocity": 1.55, "geo": 1.20, "content": .12},
    "aml": {"behavioral": .32, "merchant": .28, "beneficiary": .62, "device": .82, "velocity": 1.45, "geo": 1.35, "content": .08},
    "instrument": {"behavioral": .36, "merchant": .22, "beneficiary": .20, "device": .62, "velocity": 1.65, "geo": 1.10, "content": .12},
    "api": {"behavioral": .40, "merchant": .14, "beneficiary": .22, "device": .72, "velocity": 1.80, "geo": 1.05, "content": .05},
    "api-abuse": {"behavioral": .40, "merchant": .14, "beneficiary": .22, "device": .72, "velocity": 1.80, "geo": 1.05, "content": .05},
    "behavioral": {"behavioral": .62, "merchant": .08, "beneficiary": .25, "device": .55, "velocity": 1.15, "geo": 1.55, "content": .05},
    "cross-channel": {"behavioral": .48, "merchant": .25, "beneficiary": .58, "device": .62, "velocity": 1.50, "geo": 1.65, "content": .52},
    "cross_channel": {"behavioral": .48, "merchant": .25, "beneficiary": .58, "device": .62, "velocity": 1.50, "geo": 1.65, "content": .52},
    "autonomous": {"behavioral": .40, "merchant": .25, "beneficiary": .48, "device": .72, "velocity": 1.45, "geo": 1.25, "content": .48},
    "content": {"behavioral": .30, "merchant": .20, "beneficiary": .45, "device": .92, "velocity": 1.15, "geo": 1.10, "content": .92},
    "synthetic-content": {"behavioral": .30, "merchant": .20, "beneficiary": .45, "device": .92, "velocity": 1.15, "geo": 1.10, "content": .92},
}

GENERATOR_ALIASES = {
    "api": "api", "api-abuse": "api-abuse", "cross_channel": "cross_channel",
    "cross-channel": "cross-channel", "content": "content", "synthetic-content": "synthetic-content",
}

SIGNAL_EFFECTS = {
    "velocity": ("velocity_1h", 1.35), "behavioral_deviation": ("behavioral_deviation", .50),
    "transaction_deviation": ("behavioral_deviation", .38), "device_trust": ("device_trust_score", -.28),
    "device_reuse": ("device_reuse_score", .25), "geo_distance": ("geo_distance_km", 1.40),
    "account_age": ("account_age_days", -.20), "merchant_risk": ("merchant_risk", .38),
    "beneficiary_novelty": ("beneficiary_age_days", -.42), "recipient_novelty": ("beneficiary_age_days", -.32),
    "network_risk": ("network_risk", .40), "network_fan_in": ("beneficiary_fanout_score", .30),
    "network_fan_out": ("beneficiary_fanout_score", .36), "identity_consistency": ("identity_consistency", -.45),
    "identity_overlap": ("network_risk", .25), "cross_rail_activity": ("cross_rail_activity", .65),
    "urgency": ("urgency_score", .55), "approval_path_change": ("approval_path_change", .65),
    "content_risk": ("content_risk", .72), "recovery_change": ("approval_path_change", .40),
}


def _profile(generator_id: str) -> dict[str, float]:
    return PROFILES.get(GENERATOR_ALIASES.get(generator_id, generator_id), PROFILES["transaction"])


def _is(generator_id: str, *names: str) -> bool:
    return generator_id in names or GENERATOR_ALIASES.get(generator_id, generator_id) in names


def _apply_signal_specificity(df: pd.DataFrame, idx: pd.Index, attack, rng: np.random.Generator) -> None:
    if attack is None:
        return
    specificity = .55 + .45 * float(attack.novelty_score)
    for signal in set(attack.observable_signals):
        effect = SIGNAL_EFFECTS.get(signal)
        if not effect:
            continue
        column, magnitude = effect
        if column not in df.columns:
            continue
        strength = rng.uniform(.45, 1.0, len(idx)) * specificity * magnitude
        values = df.loc[idx, column].astype(float).to_numpy()
        if column == "device_trust_score":
            updated = np.clip(values + strength, 0, 1)
        elif column == "identity_consistency":
            updated = np.clip(values + strength, 0, 1)
        elif column in {"account_age_days", "beneficiary_age_days"}:
            updated = np.maximum(0, values * (1.0 + strength))
        elif column == "geo_distance_km":
            updated = np.maximum(0, values + strength * 30)
        elif column == "cross_rail_activity":
            updated = (values + (rng.random(len(idx)) < min(.95, abs(magnitude) * specificity))).astype(int)
        elif column == "approval_path_change":
            updated = np.maximum(values, (rng.random(len(idx)) < min(.95, abs(magnitude) * specificity)).astype(int))
        elif column == "velocity_1h":
            factor = 1 + np.maximum(strength, 0)
            updated = np.maximum(0, np.round(values * factor))
            df.loc[idx, "velocity_24h"] = np.maximum(
                df.loc[idx, "velocity_1h"].astype(float),
                np.round(df.loc[idx, "velocity_24h"].astype(float) * (1 + np.maximum(strength, 0) * .65)),
            )
        elif column in {"behavioral_deviation", "merchant_risk", "device_reuse_score", "beneficiary_fanout_score", "network_risk", "urgency_score", "content_risk"}:
            updated = np.clip(values + strength, 0, 1)
        else:
            updated = values + strength
        df.loc[idx, column] = updated


def _impose_network_patterns(df: pd.DataFrame, idx: pd.Index, generator: str, rng: np.random.Generator) -> None:
    if len(idx) == 0:
        return
    if generator == "aml":
        pool_size = max(3, min(12, len(idx) // 8 or 3))
        pool = rng.choice(df.loc[idx, "beneficiary_id"].to_numpy(), size=min(pool_size, len(idx)), replace=False)
        df.loc[idx, "beneficiary_id"] = rng.choice(pool, len(idx), replace=True)
    elif generator in {"identity", "ato", "autonomous"}:
        pool_size = max(2, min(8, len(idx) // 12 or 2))
        pool = rng.choice(df.loc[idx, "device_id"].to_numpy(), size=min(pool_size, len(idx)), replace=False)
        df.loc[idx, "device_id"] = rng.choice(pool, len(idx), replace=True)


def generate_attack_scenario(events: int, seed: int, attack_ids: list[str], fraud_rate: float = .12, difficulty: str = "high", adaptation: str = "static", noise: str = "medium") -> pd.DataFrame:
    """Generate deterministic synthetic payment telemetry for defensive evaluation."""
    attacks = {a.id: a for a in load_attacks()}
    df = generate_transactions(events, seed, fraud_rate, attack_ids)
    rng = np.random.default_rng(seed + 17)
    fraud_idx = df.index[df["ground_truth"].eq(1)]

    df["scenario_id"] = None
    df["scenario_stage"] = 0
    df["urgency_score"] = np.clip(rng.beta(1.2, 8, events), 0, 1)
    df["approval_path_change"] = 0
    df["content_risk"] = np.clip(rng.beta(1.1, 12, events), 0, 1)
    df["cross_rail_activity"] = 0
    df["identity_consistency"] = np.clip(rng.normal(.86, .10, events), 0, 1)
    df["attack_family"] = None
    df["attack_difficulty"] = None
    df["attack_novelty"] = np.nan
    df["attack_severity"] = None
    df["attack_name"] = None

    if not len(fraud_idx) or not attack_ids:
        return df

    selected = [x for x in attack_ids if x in attacks] or attack_ids
    assignments = rng.choice(selected, len(fraud_idx))
    df.loc[fraud_idx, "attack_id"] = assignments

    for attack_id in np.unique(assignments):
        idx = fraud_idx[assignments == attack_id]
        attack = attacks.get(str(attack_id))
        generator = attack.generator_id if attack else "transaction"
        profile = _profile(generator)
        difficulty_multiplier = {"low": .70, "medium": .90, "high": 1.0, "very-high": 1.18}.get(difficulty, 1.0)
        adaptation_multiplier = {"static": .85, "adaptive": 1.0, "adversarial": 1.10}.get(adaptation, 1.0)
        noise_factor = {"low": .25, "medium": .45, "high": .70}.get(noise, .45)
        for column, factor, baseline in [
            ("behavioral_deviation", profile["behavioral"], .12),
            ("merchant_risk", profile["merchant"], .16),
            ("beneficiary_age_days", -profile["beneficiary"], 180),
            ("device_trust_score", -profile["device"], .88),
            ("velocity_1h", profile["velocity"], 1),
            ("geo_distance_km", profile["geo"], 5),
            ("content_risk", profile["content"], .08),
        ]:
            current = df.loc[idx, column].astype(float).to_numpy()
            if column in {"beneficiary_age_days", "device_trust_score"}:
                effect = factor * difficulty_multiplier * adaptation_multiplier
                if column == "device_trust_score":
                    updated = np.clip(current + factor * difficulty_multiplier * adaptation_multiplier + rng.normal(0, noise_factor * .03, len(idx)), 0, 1)
                else:
                    updated = np.maximum(0, current * np.clip(1 + effect * .40, .05, 2.0))
            else:
                multiplier = 1 + factor * difficulty_multiplier * adaptation_multiplier
                updated = current * multiplier + rng.normal(0, max(current.mean(), baseline) * noise_factor * .02, len(idx))
                if column in {"behavioral_deviation", "merchant_risk", "content_risk"}:
                    updated = np.clip(updated, 0, 1)
                else:
                    updated = np.maximum(0, updated)
            df.loc[idx, column] = updated

        _apply_signal_specificity(df, idx, attack, rng)
        _impose_network_patterns(df, idx, generator, rng)

        if attack:
            df.loc[idx, "attack_family"] = attack.family
            df.loc[idx, "attack_difficulty"] = attack.difficulty
            df.loc[idx, "attack_novelty"] = float(attack.novelty_score)
            df.loc[idx, "attack_severity"] = attack.severity
            df.loc[idx, "attack_name"] = attack.name
            if "approval_path_change" in attack.observable_signals:
                df.loc[idx, "approval_path_change"] = 1
            if any(signal in attack.observable_signals for signal in ("cross_rail_activity", "rail_hopping")):
                df.loc[idx, "cross_rail_activity"] = 1

        if _is(generator, "social", "cross-channel", "cross_channel", "content", "synthetic-content"):
            df.loc[idx, "urgency_score"] = np.clip(df.loc[idx, "urgency_score"] + profile["content"] * .55, 0, 1)
        if _is(generator, "social", "ato", "cross-channel", "cross_channel"):
            df.loc[idx, "approval_path_change"] = np.maximum(df.loc[idx, "approval_path_change"].astype(int), (rng.random(len(idx)) < .45 * adaptation_multiplier).astype(int))
        if _is(generator, "api", "api-abuse"):
            df.loc[idx, "velocity_1h"] = np.maximum(df.loc[idx, "velocity_1h"].astype(float), np.round(df.loc[idx, "velocity_1h"].astype(float) * (1.5 * adaptation_multiplier)))

        stages = 1
        if _is(generator, "cross-channel", "cross_channel", "autonomous", "aml"):
            stages = 2 + int(rng.random() < .35)
        df.loc[idx, "scenario_stage"] = stages
        df.loc[idx, "scenario_id"] = f"SCN-{seed}-{str(attack_id)}-{idx.min()}"

    return df
