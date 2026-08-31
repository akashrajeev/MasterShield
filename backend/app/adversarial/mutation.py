from __future__ import annotations

import numpy as np
import pandas as pd

MUTABLE = [
    "amount", "velocity_1h", "velocity_24h", "geo_distance_km",
    "beneficiary_age_days", "device_trust_score", "behavioral_deviation", "merchant_risk",
    "urgency_score", "content_risk",
]


def mutate(df: pd.DataFrame, seed: int, strength: float = .2, round_no: int = 1) -> pd.DataFrame:
    """Mutate synthetic fraud telemetry while preserving valid value ranges."""
    rng = np.random.default_rng(seed)
    out = df.copy()
    for col in MUTABLE:
        if col not in out:
            continue
        scale = max(float(out[col].std()), 1e-6) * strength
        out[col] = out[col].astype(float) + rng.normal(0, scale, len(out))
    for col in ["velocity_1h", "velocity_24h", "beneficiary_age_days"]:
        if col in out:
            out[col] = out[col].clip(0).round()
    for col in ["device_trust_score", "behavioral_deviation", "merchant_risk", "urgency_score", "content_risk"]:
        if col in out:
            out[col] = out[col].clip(0, 1)
    if "amount" in out:
        out["amount"] = out["amount"].clip(20, 500000).round(2)
    if "velocity_24h" in out and "velocity_1h" in out:
        out["velocity_24h"] = np.maximum(out["velocity_24h"], out["velocity_1h"])
    out["mutation_round"] = round_no
    out["mutation_seed"] = seed
    out["synthetic_adversarial"] = 1
    return out
