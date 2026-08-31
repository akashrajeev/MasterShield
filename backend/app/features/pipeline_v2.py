from __future__ import annotations

import numpy as np
import pandas as pd

from .pipeline import build_features as build_current_features
from .graph import derive_network_features


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compatibility adapter for the earlier feature schema used by legacy tests."""
    current = build_current_features(df)
    raw = derive_network_features(df.copy())
    out = current.copy()
    out["shared_device_count"] = raw.get("device_account_count", pd.Series(0, index=raw.index)).astype(float)
    out["beneficiary_novelty"] = (raw.get("beneficiary_age_days", pd.Series(0, index=raw.index)) < 14).astype(int)
    out["network_fan_in"] = raw.get("beneficiary_account_degree", pd.Series(0, index=raw.index)).astype(float)
    out["network_fan_out"] = raw.get("account_beneficiary_degree", pd.Series(0, index=raw.index)).astype(float)
    out["network_degree"] = out["network_fan_in"] + out["network_fan_out"]
    out["network_imbalance"] = (
        (out["network_fan_in"] - out["network_fan_out"]).abs() / (out["network_degree"] + 1)
    )
    out["combined_behavior_risk"] = (
        .35 * out["behavioral_deviation"]
        + .20 * (1 - out["device_trust_score"])
        + .15 * out["merchant_risk"]
        + .15 * out["content_risk"]
        + .15 * (1 - out["identity_consistency"])
    )
    return out.replace([np.inf, -np.inf], 0).fillna(0)
