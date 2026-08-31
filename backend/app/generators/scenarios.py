from __future__ import annotations

import numpy as np
import pandas as pd

from .transaction import generate_transactions
from ..identify.catalog import load_attacks

PROFILES: dict[str, dict[str, float]] = {
    "identity": {"behavioral": .28, "merchant": .18, "beneficiary": .35, "device": .88, "velocity": 1.10, "geo": 1.25},
    "social": {"behavioral": .42, "merchant": .12, "beneficiary": .48, "device": .95, "velocity": 1.20, "geo": 1.10},
    "ato": {"behavioral": .58, "merchant": .10, "beneficiary": .72, "device": .58, "velocity": 1.55, "geo": 2.0},
    "merchant": {"behavioral": .26, "merchant": .58, "beneficiary": .28, "device": .90, "velocity": 1.35, "geo": 1.15},
    "transaction": {"behavioral": .46, "merchant": .18, "beneficiary": .42, "device": .96, "velocity": 1.55, "geo": 1.20},
    "aml": {"behavioral": .32, "merchant": .28, "beneficiary": .62, "device": .82, "velocity": 1.45, "geo": 1.35},
    "instrument": {"behavioral": .36, "merchant": .22, "beneficiary": .20, "device": .62, "velocity": 1.65, "geo": 1.10},
    "api": {"behavioral": .40, "merchant": .14, "beneficiary": .22, "device": .72, "velocity": 1.80, "geo": 1.05},
    "behavioral": {"behavioral": .62, "merchant": .08, "beneficiary": .25, "device": .55, "velocity": 1.15, "geo": 1.55},
    "cross-channel": {"behavioral": .48, "merchant": .25, "beneficiary": .58, "device": .62, "velocity": 1.50, "geo": 1.65},
    "autonomous": {"behavioral": .40, "merchant": .25, "beneficiary": .48, "device": .72, "velocity": 1.45, "geo": 1.25},
    "content": {"behavioral": .30, "merchant": .20, "beneficiary": .45, "device": .92, "velocity": 1.15, "geo": 1.10},
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
    if not len(fraud_idx) or not attack_ids:
        return df

    selected = [x for x in attack_ids if x in attacks] or attack_ids
    assignments = rng.choice(selected, len(fraud_idx))
    df.loc[fraud_idx, "attack_id"] = assignments

    for attack_id in np.unique(assignments):
        idx = fraud_idx[assignments == attack_id]
        attack = attacks.get(str(attack_id))
        p = _profile(attack.generator_id if attack else "transaction")
        strength = rng.uniform(.55, 1.0, len(idx))
        df.loc[idx, "behavioral_deviation"] = np.clip(df.loc[idx, "behavioral_deviation"] + p["behavioral"] * strength, 0, 1)
        df.loc[idx, "merchant_risk"] = np.clip(df.loc[idx, "merchant_risk"] + p["merchant"] * strength, 0, 1)
        max_age = max(2, int(30 * p["beneficiary"]))
        df.loc[idx, "beneficiary_age_days"] = np.minimum(df.loc[idx, "beneficiary_age_days"], rng.integers(0, max_age, len(idx)))
        df.loc[idx, "device_trust_score"] = np.clip(df.loc[idx, "device_trust_score"] * rng.uniform(p["device"], 1.0, len(idx)), 0, 1)
        df.loc[idx, "velocity_1h"] = np.maximum(0, np.round(df.loc[idx, "velocity_1h"] * p["velocity"] + rng.poisson(.7, len(idx))))
        df.loc[idx, "velocity_24h"] = np.maximum(df.loc[idx, "velocity_1h"], np.round(df.loc[idx, "velocity_24h"] * p["velocity"] + rng.poisson(2.0, len(idx))))
        df.loc[idx, "geo_distance_km"] = np.maximum(0, df.loc[idx, "geo_distance_km"] * p["geo"])
        df.loc[idx, "scenario_id"] = [f"SCN-{seed}-{int(i):06d}" for i in idx]
        generator = attack.generator_id if attack else "transaction"
        df.loc[idx, "scenario_stage"] = rng.choice([2, 3, 4], len(idx), p=[.50, .35, .15]) if generator in {"cross-channel", "autonomous"} else 2

    # High difficulty makes fraud telemetry partially overlap with benign behavior.
    if difficulty == "high":
        for col in ["behavioral_deviation", "merchant_risk"]:
            df.loc[fraud_idx, col] = np.clip(df.loc[fraud_idx, col] + rng.normal(0, .04, len(fraud_idx)), 0, 1)
    elif difficulty == "very-high":
        for col in ["behavioral_deviation", "merchant_risk", "device_trust_score"]:
            df.loc[fraud_idx, col] = np.clip(df.loc[fraud_idx, col] + rng.normal(0, .09, len(fraud_idx)), 0, 1)
        df.loc[fraud_idx, "velocity_1h"] = np.maximum(0, np.round(df.loc[fraud_idx, "velocity_1h"] * rng.uniform(.70, 1.02, len(fraud_idx))))
    return df
