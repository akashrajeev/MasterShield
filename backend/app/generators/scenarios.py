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
    "api": "api",
    "api-abuse": "api-abuse",
    "cross_channel": "cross_channel",
    "cross-channel": "cross-channel",
    "content": "content",
    "synthetic-content": "synthetic-content",
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
    normalized = GENERATOR_ALIASES.get(generator_id, generator_id)
    return PROFILES.get(normalized, PROFILES["transaction"])


def _set_series_values(df: pd.DataFrame, idx: pd.Index, column: str, values) -> None:
    """Assign numeric values through a float-backed Series to avoid pandas dtype warnings."""
    series = df[column].astype(np.float64).copy()
    series.loc[idx] = np.asarray(values, dtype=np.float64)
    df[column] = series


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
        if column == "device_trust_score":
            _set_series_values(df, idx, column, np.clip(df.loc[idx, column].astype(float) + strength, 0, 1))
        elif column == "identity_consistency":
            _set_series_values(df, idx, column, np.clip(df.loc[idx, column].astype(float) + strength, 0, 1))
        elif column in {"account_age_days", "beneficiary_age_days"}:
            _set_series_values(df, idx, column, np.maximum(0, df.loc[idx, column].astype(float) * (1.0 + strength)))
        elif column == "geo_distance_km":
            _set_series_values(df, idx, column, np.maximum(0, df.loc[idx, column].astype(float) + strength * 30))
        elif column == "cross_rail_activity":
            df.loc[idx, column] = (df.loc[idx, column].to_numpy() + (rng.random(len(idx)) < min(.95, abs(magnitude) * specificity))).astype(int)
        elif column == "approval_path_change":
            df.loc[idx, column] = np.maximum(df.loc[idx, column].to_numpy(dtype=int), (rng.random(len(idx)) < min(.95, abs(magnitude) * specificity)).astype(int))
        elif column == "velocity_1h":
            factor = 1 + np.maximum(strength, 0)
            updated_v1 = np.maximum(0, np.round(df.loc[idx, column].to_numpy(dtype=float) * factor))
            _set_series_values(df, idx, column, updated_v1)
            updated_v24 = np.maximum(
                df.loc[idx, "velocity_1h"].to_numpy(dtype=float),
                np.round(df.loc[idx, "velocity_24h"].to_numpy(dtype=float) * (1 + np.maximum(strength, 0) * .65)),
            )
            _set_series_values(df, idx, "velocity_24h", updated_v24)
        elif column in {"behavioral_deviation", "merchant_risk", "device_reuse_score", "beneficiary_fanout_score", "network_risk", "urgency_score", "content_risk"}:
            _set_series_values(df, idx, column, np.clip(df.loc[idx, column].astype(float) + strength, 0, 1))


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
    for column in ["amount", "velocity_1h", "velocity_24h", "geo_distance_km", "beneficiary_age_days", "device_trust_score", "behavioral_deviation", "merchant_risk"]:
        if column in df.columns:
            df[column] = df[column].astype(np.float64)
    rng = np.random.default_rng(seed + 17)
    fraud_idx = df.index[df["ground_truth"].eq(1)]

    df["scenario_id"] = None; df["scenario_stage"] = 0
    df["urgency_score"] = np.clip(rng.beta(1.2, 8, events), 0, 1)
    df["approval_path_change"] = 0
    df["content_risk"] = np.clip(rng.beta(1.1, 12, events), 0, 1)
    df["cross_rail_activity"] = 0
    df["identity_consistency"] = np.clip(rng.normal(.86, .10, events), 0, 1)
    df["attack_family"] = None; df["attack_difficulty"] = None
    df["attack_novelty"] = np.nan; df["attack_severity"] = None; df["attack_name"] = None

    if not len(fraud_idx) or not attack_ids:
        return df

    selected = [x for x in attack_ids if x in attacks] or attack_ids
    assignments = rng.choice(selected, len(fraud_idx))
    df.loc[fraud_idx, "attack_id"] = assignments

    for attack_id in np.unique(assignments):
        idx = fraud_idx[assignments == attack_id]
        attack = attacks.get(str(attack_id))
        generator_raw = attack.generator_id if attack else "transaction"
        generator = GENERATOR_ALIASES.get(generator_raw, generator_raw)
        p = _profile(generator_raw)
        strength = rng.uniform(.55, 1.0, len(idx))
        if attack is not None:
            df.loc[idx, "attack_family"] = attack.family; df.loc[idx, "attack_difficulty"] = attack.difficulty
            df.loc[idx, "attack_novelty"] = float(attack.novelty_score); df.loc[idx, "attack_severity"] = attack.severity; df.loc[idx, "attack_name"] = attack.name
        _set_series_values(df, idx, "behavioral_deviation", np.clip(df.loc[idx, "behavioral_deviation"].astype(float) + p["behavioral"] * strength, 0, 1))
        _set_series_values(df, idx, "merchant_risk", np.clip(df.loc[idx, "merchant_risk"].astype(float) + p["merchant"] * strength, 0, 1))
        _set_series_values(df, idx, "beneficiary_age_days", np.minimum(df.loc[idx, "beneficiary_age_days"].astype(float), rng.integers(0, max(2, int(30 * p["beneficiary"])), len(idx))))
        _set_series_values(df, idx, "device_trust_score", np.clip(df.loc[idx, "device_trust_score"].astype(float) * rng.uniform(p["device"], 1.0, len(idx)), 0, 1))
        _set_series_values(df, idx, "velocity_1h", np.maximum(0, np.round(df.loc[idx, "velocity_1h"].to_numpy(dtype=float) * p["velocity"] + rng.poisson(.7, len(idx)))))
        _set_series_values(df, idx, "velocity_24h", np.maximum(df.loc[idx, "velocity_1h"].to_numpy(dtype=float), np.round(df.loc[idx, "velocity_24h"].to_numpy(dtype=float) * p["velocity"] + rng.poisson(2.0, len(idx)))))
        _set_series_values(df, idx, "geo_distance_km", np.maximum(0, df.loc[idx, "geo_distance_km"].to_numpy(dtype=float) * p["geo"]))
        _set_series_values(df, idx, "content_risk", np.clip(df.loc[idx, "content_risk"].astype(float) + p["content"] * strength, 0, 1))
        _set_series_values(df, idx, "urgency_score", np.clip(df.loc[idx, "urgency_score"].astype(float) + (.75 if generator == "social" else .18) * strength, 0, 1))
        df.loc[idx, "approval_path_change"] = (rng.random(len(idx)) < (0.20 + .60 * (generator in {"social", "ato", "cross-channel", "cross_channel", "autonomous"}))).astype(int)
        df.loc[idx, "cross_rail_activity"] = (rng.random(len(idx)) < (.62 if generator in {"cross-channel", "cross_channel", "autonomous", "aml"} else .06)).astype(int)
        _impose_network_patterns(df, idx, generator, rng)
        _apply_signal_specificity(df, idx, attack, rng)
        if generator in {"cross-channel", "cross_channel", "autonomous"}:
            idx_list = list(idx); cursor = 0
            while cursor < len(idx_list):
                remaining = len(idx_list) - cursor
                width = 1 if remaining == 1 else int(rng.integers(2, min(4, remaining) + 1))
                members = idx_list[cursor: cursor + width]
                sid = f"SCN-{seed}-{int(members[0]):06d}"
                df.loc[members, "scenario_id"] = sid
                df.loc[members, "scenario_stage"] = np.arange(1, len(members) + 1)
                cursor += width
        else:
            df.loc[idx, "scenario_id"] = [f"SCN-{seed}-{int(i):06d}" for i in idx]
            df.loc[idx, "scenario_stage"] = 2

    if difficulty == "low":
        _set_series_values(df, fraud_idx, "behavioral_deviation", np.clip(df.loc[fraud_idx, "behavioral_deviation"].astype(float) + .08, 0, 1))
    elif difficulty == "high":
        for col in ["behavioral_deviation", "merchant_risk", "content_risk"]:
            _set_series_values(df, fraud_idx, col, np.clip(df.loc[fraud_idx, col].astype(float) + rng.normal(0, .04, len(fraud_idx)), 0, 1))
    elif difficulty == "very-high":
        noise_scale = .06 if noise == "low" else .09 if noise == "medium" else .13
        for col in ["behavioral_deviation", "merchant_risk", "device_trust_score", "content_risk"]:
            _set_series_values(df, fraud_idx, col, np.clip(df.loc[fraud_idx, col].astype(float) + rng.normal(0, noise_scale, len(fraud_idx)), 0, 1))
        _set_series_values(df, fraud_idx, "velocity_1h", np.maximum(0, np.round(df.loc[fraud_idx, "velocity_1h"].astype(float) * rng.uniform(.70, 1.02, len(fraud_idx)))))
        _set_series_values(df, fraud_idx, "urgency_score", np.clip(df.loc[fraud_idx, "urgency_score"].astype(float) - rng.uniform(0, .15, len(fraud_idx)), 0, 1))

    if adaptation in {"adaptive", "adversarial"}:
        blend = .08 if adaptation == "adaptive" else .14
        for col in ["behavioral_deviation", "merchant_risk", "content_risk"]:
            benign = df.loc[df["ground_truth"].eq(0), col]
            target = float(benign.median()) if len(benign) else .35
            _set_series_values(df, fraud_idx, col, (1 - blend) * df.loc[fraud_idx, col].astype(float) + blend * target)
        _set_series_values(df, fraud_idx, "velocity_1h", np.maximum(0, np.round(df.loc[fraud_idx, "velocity_1h"].astype(float) * (1 - blend / 2))))

    return df
