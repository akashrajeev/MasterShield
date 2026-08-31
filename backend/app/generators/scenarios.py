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
    "behavioral": {"behavioral": .62, "merchant": .08, "beneficiary": .25, "device": .55, "velocity": 1.15, "geo": 1.55, "content": .05},
    "cross-channel": {"behavioral": .48, "merchant": .25, "beneficiary": .58, "device": .62, "velocity": 1.50, "geo": 1.65, "content": .52},
    "autonomous": {"behavioral": .40, "merchant": .25, "beneficiary": .48, "device": .72, "velocity": 1.45, "geo": 1.25, "content": .48},
    "content": {"behavioral": .30, "merchant": .20, "beneficiary": .45, "device": .92, "velocity": 1.15, "geo": 1.10, "content": .92},
}


def _profile(generator_id: str) -> dict[str, float]:
    return PROFILES.get(generator_id, PROFILES["transaction"])


def generate_attack_scenario(events: int, seed: int, attack_ids: list[str], fraud_rate: float = .12, difficulty: str = "high") -> pd.DataFrame:
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
    if not len(fraud_idx) or not attack_ids:
        return df

    selected = [x for x in attack_ids if x in attacks] or attack_ids
    assignments = rng.choice(selected, len(fraud_idx))
    df.loc[fraud_idx, "attack_id"] = assignments

    for attack_id in np.unique(assignments):
        idx = fraud_idx[assignments == attack_id]
        attack = attacks.get(str(attack_id))
        generator = attack.generator_id if attack else "transaction"
        p = _profile(generator)
        strength = rng.uniform(.55, 1.0, len(idx))
        df.loc[idx, "behavioral_deviation"] = np.clip(df.loc[idx, "behavioral_deviation"] + p["behavioral"] * strength, 0, 1)
        df.loc[idx, "merchant_risk"] = np.clip(df.loc[idx, "merchant_risk"] + p["merchant"] * strength, 0, 1)
        max_age = max(2, int(30 * p["beneficiary"]))
        df.loc[idx, "beneficiary_age_days"] = np.minimum(df.loc[idx, "beneficiary_age_days"], rng.integers(0, max_age, len(idx)))
        df.loc[idx, "device_trust_score"] = np.clip(df.loc[idx, "device_trust_score"] * rng.uniform(p["device"], 1.0, len(idx)), 0, 1)
        df.loc[idx, "velocity_1h"] = np.maximum(0, np.round(df.loc[idx, "velocity_1h"] * p["velocity"] + rng.poisson(.7, len(idx))))
        df.loc[idx, "velocity_24h"] = np.maximum(df.loc[idx, "velocity_1h"], np.round(df.loc[idx, "velocity_24h"] * p["velocity"] + rng.poisson(2.0, len(idx))))
        df.loc[idx, "geo_distance_km"] = np.maximum(0, df.loc[idx, "geo_distance_km"] * p["geo"])
        df.loc[idx, "content_risk"] = np.clip(df.loc[idx, "content_risk"] + p["content"] * strength, 0, 1)
        df.loc[idx, "urgency_score"] = np.clip(df.loc[idx, "urgency_score"] + (.75 if generator == "social" else .2) * strength, 0, 1)
        df.loc[idx, "approval_path_change"] = (rng.random(len(idx)) < (0.25 + .55 * (generator in {"social", "ato", "cross-channel", "autonomous"}))).astype(int)
        df.loc[idx, "cross_rail_activity"] = (rng.random(len(idx)) < (.65 if generator in {"cross-channel", "autonomous", "aml"} else .08)).astype(int)

        if generator in {"cross-channel", "autonomous"}:
            # Link 2–4 transaction records into one synthetic campaign/scenario.
            idx_list = list(idx)
            cursor = 0
            while cursor < len(idx_list):
                width = int(rng.integers(2, min(4, len(idx_list) - cursor) + 1))
                members = idx_list[cursor: cursor + width]
                sid = f"SCN-{seed}-{int(members[0]):06d}"
                df.loc[members, "scenario_id"] = sid
                df.loc[members, "scenario_stage"] = np.arange(1, len(members) + 1)
                cursor += width
        else:
            df.loc[idx, "scenario_id"] = [f"SCN-{seed}-{int(i):06d}" for i in idx]
            df.loc[idx, "scenario_stage"] = 2

    if difficulty == "high":
        for col in ["behavioral_deviation", "merchant_risk", "content_risk"]:
            df.loc[fraud_idx, col] = np.clip(df.loc[fraud_idx, col] + rng.normal(0, .04, len(fraud_idx)), 0, 1)
    elif difficulty == "very-high":
        for col in ["behavioral_deviation", "merchant_risk", "device_trust_score", "content_risk"]:
            noise = rng.normal(0, .09, len(fraud_idx))
            df.loc[fraud_idx, col] = np.clip(df.loc[fraud_idx, col] + noise, 0, 1)
        df.loc[fraud_idx, "velocity_1h"] = np.maximum(0, np.round(df.loc[fraud_idx, "velocity_1h"] * rng.uniform(.70, 1.02, len(fraud_idx))))
        df.loc[fraud_idx, "urgency_score"] = np.clip(df.loc[fraud_idx, "urgency_score"] - rng.uniform(0, .15, len(fraud_idx)), 0, 1)
    return df
