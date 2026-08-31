from __future__ import annotations

import pandas as pd


def derive_network_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute graph-like risk features from the synthetic payment event stream."""
    out = df.copy()
    out["account_transaction_count"] = out.groupby("account_id")["transaction_id"].transform("count")
    out["beneficiary_transaction_count"] = out.groupby("beneficiary_id")["transaction_id"].transform("count")
    out["device_account_count"] = out.groupby("device_id")["account_id"].transform("nunique")
    out["merchant_account_count"] = out.groupby("merchant_id")["account_id"].transform("nunique")
    out["account_beneficiary_degree"] = out.groupby("account_id")["beneficiary_id"].transform("nunique")
    out["beneficiary_account_degree"] = out.groupby("beneficiary_id")["account_id"].transform("nunique")
    out["device_reuse_score"] = (out["device_account_count"] - 1).clip(lower=0) / 5
    out["beneficiary_fanout_score"] = (out["beneficiary_account_degree"] - 1).clip(lower=0) / 8
    out["network_concentration"] = out["account_beneficiary_degree"] / (out["beneficiary_account_degree"] + 1)
    out["network_risk"] = (
        0.35 * out["device_reuse_score"].clip(0, 1)
        + 0.35 * out["beneficiary_fanout_score"].clip(0, 1)
        + 0.30 * out["network_concentration"].clip(0, 1)
    ).clip(0, 1)
    return out
