from __future__ import annotations

import numpy as np
import pandas as pd

from .graph import derive_network_features

# Ground-truth/attack metadata is intentionally excluded from model features.
# These columns remain available in generated records for evaluation only.
BASE_FEATURES = [
    "amount", "amount_zscore", "velocity_1h", "velocity_24h", "geo_distance_km",
    "beneficiary_age_days", "device_trust_score", "behavioral_deviation", "merchant_risk",
    "account_age_days", "normal_daily_txns", "network_risk", "device_reuse_score",
    "beneficiary_fanout_score", "account_beneficiary_degree", "beneficiary_account_degree",
    "account_outflow", "beneficiary_inflow", "account_to_beneficiary_share",
    "beneficiary_amount_share", "counterparty_count", "network_amount_concentration",
    "urgency_score", "approval_path_change", "content_risk", "cross_rail_activity",
    "identity_consistency",
]

FEATURE_NAMES = BASE_FEATURES + [
    "amount_log", "velocity_ratio", "new_beneficiary", "low_device_trust",
    "high_velocity", "large_geo_jump", "young_account_flag",
    "behavioral_amount_interaction", "graph_signal",
]


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Convert synthetic event history into a stable, leakage-safe model matrix.

    Attack labels, scenario stage/IDs and other ground-truth metadata are excluded
    so the classifier must learn from observable payment behavior instead of labels.
    """
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
    x["young_account_flag"] = (x["account_age_days"] < 30).astype(int)
    x["behavioral_amount_interaction"] = x["behavioral_deviation"] * x["amount_log"]
    x["graph_signal"] = (
        .30 * x["network_risk"].clip(0, 1)
        + .20 * (x["device_reuse_score"] / 5).clip(0, 1)
        + .20 * (x["beneficiary_fanout_score"] / 8).clip(0, 1)
        + .15 * x["network_amount_concentration"].clip(0, 1)
        + .15 * (1 / (x["counterparty_count"] + 1)).clip(0, 1)
    ).clip(0, 1)
    return x.replace([np.inf, -np.inf], 0).fillna(0)
