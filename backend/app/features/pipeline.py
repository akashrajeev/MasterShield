from __future__ import annotations

import numpy as np
import pandas as pd

from .graph import derive_network_features

BASE_FEATURES = [
    "amount", "amount_zscore", "velocity_1h", "velocity_24h", "geo_distance_km",
    "beneficiary_age_days", "device_trust_score", "behavioral_deviation", "merchant_risk",
    "account_age_days", "normal_daily_txns", "network_risk", "device_reuse_score",
    "beneficiary_fanout_score", "account_beneficiary_degree", "beneficiary_account_degree",
]

FEATURE_NAMES = BASE_FEATURES + ["amount_log", "velocity_ratio", "new_beneficiary", "low_device_trust", "high_velocity", "large_geo_jump"]


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    out = derive_network_features(df.copy())
    for col in BASE_FEATURES:
        if col not in out.columns:
            out[col] = 0.0
    x = out[BASE_FEATURES].copy()
    x["amount_log"] = np.log1p(x["amount"].clip(lower=0))
    x["velocity_ratio"] = x["velocity_1h"] / (x["velocity_24h"] + 1)
    x["new_beneficiary"] = (x["beneficiary_age_days"] < 14).astype(int)
    x["low_device_trust"] = (x["device_trust_score"] < .5).astype(int)
    x["high_velocity"] = (x["velocity_1h"] >= 6).astype(int)
    x["large_geo_jump"] = (x["geo_distance_km"] >= 50).astype(int)
    return x.replace([np.inf, -np.inf], 0).fillna(0)
