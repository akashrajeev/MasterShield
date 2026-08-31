from __future__ import annotations
import pandas as pd


def derive_network_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    # Synthetic transaction-network proxies. These operate only on generated IDs/events.
    out["account_transaction_count"] = out.groupby("account_id")["transaction_id"].transform("count")
    out["beneficiary_transaction_count"] = out.groupby("beneficiary_id")["transaction_id"].transform("count")
    out["device_account_count"] = out.groupby("device_id")["account_id"].transform("nunique")
    out["merchant_account_count"] = out.groupby("merchant_id")["account_id"].transform("nunique")
    out["account_beneficiary_degree"] = out.groupby("account_id")["beneficiary_id"].transform("nunique")
    out["beneficiary_account_degree"] = out.groupby("beneficiary_id")["account_id"].transform("nunique")
    out["network_concentration"] = out["account_beneficiary_degree"] / (out["beneficiary_account_degree"] + 1)
    return out
