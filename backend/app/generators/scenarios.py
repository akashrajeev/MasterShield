from __future__ import annotations

import numpy as np
import pandas as pd
from .transaction import generate_transactions

# Defensive simulation profiles. These alter only synthetic payment telemetry;
# no real attack tooling or external-system interaction is performed.
PROFILES = {
    "identity": {"behavioral_deviation": .55, "merchant_risk": .45, "beneficiary_age": .35},
    "social": {"behavioral_deviation": .62, "merchant_risk": .35, "beneficiary_age": .55},
    "ato": {"behavioral_deviation": .72, "merchant_risk": .35, "beneficiary_age": .70, "device_trust": .35, "geo": 1.8},
    "merchant": {"behavioral_deviation": .48, "merchant_risk": .78, "beneficiary_age": .30},
    "transaction": {"behavioral_deviation": .65, "merchant_risk": .55, "beneficiary_age": .60, "velocity": 1.8},
    "aml": {"behavioral_deviation": .52, "merchant_risk": .62, "beneficiary_age": .65, "velocity": 1.5},
    "instrument": {"behavioral_deviation": .55, "merchant_risk": .52, "device_trust": .50, "velocity": 1.4},
    "api": {"behavioral_deviation": .58, "merchant_risk": .45, "velocity": 1.7},
    "behavioral": {"behavioral_deviation": .78, "merchant_risk": .40, "device_trust": .45, "geo": 1.4},
    "cross_channel": {"behavioral_deviation": .70, "merchant_risk": .60, "beneficiary_age": .65, "velocity": 1.5},
    "autonomous": {"behavioral_deviation": .50, "merchant_risk": .50, "beneficiary_age": .55},
    "content": {"behavioral_deviation": .57, "merchant_risk": .40, "beneficiary_age": .55},
}


def generate_attack_scenario(events: int, seed: int, attack_ids: list[str], fraud_rate: float = .12, difficulty: str = "high") -> pd.DataFrame:
    df = generate_transactions(events, seed, fraud_rate, attack_ids)
    rng = np.random.default_rng(seed + 17)
    if not attack_ids:
        return df

    # Apply deterministic family-level telemetry patterns to fraud rows.
    for attack_id in attack_ids:
        prefix = attack_id.split("-")[0]
        generator = {
            "ID": "identity", "SE": "social", "ATO": "ato", "ME": "merchant",
            "TE": "transaction", "AML": "aml", "PI": "instrument", "API": "api",
            "BE": "behavioral", "CC": "cross_channel", "AG": "autonomous", "SC": "content",
        }.get(prefix, "transaction")
        idx = df.index[df["attack_id"].eq(attack_id)]
        if len(idx) == 0:
            continue
        p = PROFILES[generator]
        if "behavioral_deviation" in p:
            df.loc[idx, "behavioral_deviation"] = np.clip(df.loc[idx, "behavioral_deviation"] + p["behavioral_deviation"] * rng.uniform(.4, 1.0, len(idx)), 0, 1)
        if "merchant_risk" in p:
            df.loc[idx, "merchant_risk"] = np.clip(df.loc[idx, "merchant_risk"] + p["merchant_risk"] * rng.uniform(.3, .9, len(idx)), 0, 1)
        if "beneficiary_age" in p:
            df.loc[idx, "beneficiary_age_days"] = np.minimum(df.loc[idx, "beneficiary_age_days"], (p["beneficiary_age"] * 30 * rng.uniform(.2, 1, len(idx))).astype(int))
        if "device_trust" in p:
            df.loc[idx, "device_trust_score"] *= rng.uniform(p["device_trust"], .9, len(idx))
        if "geo" in p:
            df.loc[idx, "geo_distance_km"] *= p["geo"]
        if "velocity" in p:
            df.loc[idx, "velocity_1h"] = (df.loc[idx, "velocity_1h"] * p["velocity"] + rng.poisson(1, len(idx))).round()
            df.loc[idx, "velocity_24h"] = (df.loc[idx, "velocity_24h"] * p["velocity"] + rng.poisson(3, len(idx))).round()

    # Very-high difficulty adds bounded noise, making variants less separable.
    if difficulty == "very-high":
        fraud_idx = df.index[df.ground_truth.eq(1)]
        for col in ["behavioral_deviation", "merchant_risk", "device_trust_score"]:
            df.loc[fraud_idx, col] = np.clip(df.loc[fraud_idx, col] + rng.normal(0, .06, len(fraud_idx)), 0, 1)
    return df
