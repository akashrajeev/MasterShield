from __future__ import annotations

import numpy as np
import pandas as pd


def _cumulative_unique_count(df: pd.DataFrame, group_col: str, value_col: str) -> pd.Series:
    work = df[[group_col, value_col]].copy()
    work["_position"] = np.arange(len(work))
    firsts = work.drop_duplicates([group_col, value_col], keep="first").copy()
    firsts["_count"] = firsts.groupby(group_col).cumcount() + 1
    merged = work.merge(
        firsts[[group_col, value_col, "_count"]],
        on=[group_col, value_col],
        how="left",
        sort=False,
    )
    merged = merged.sort_values("_position")
    return merged.groupby(group_col)["_count"].transform("cummax").reset_index(drop=True)


def _cumulative_sum(df: pd.DataFrame, group_col: str, value_col: str) -> pd.Series:
    return df.groupby(group_col, sort=False)[value_col].cumsum().astype(float)


def derive_network_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute synthetic relationship and AML-flow signals causally."""
    out = df.copy()
    if "timestamp" in out.columns:
        out = out.sort_values("timestamp").reset_index(drop=True)

    out["account_transaction_count"] = out.groupby("account_id").cumcount() + 1
    out["beneficiary_transaction_count"] = out.groupby("beneficiary_id").cumcount() + 1
    out["device_account_count"] = _cumulative_unique_count(out, "device_id", "account_id")
    out["merchant_account_count"] = _cumulative_unique_count(out, "merchant_id", "account_id")
    out["account_beneficiary_degree"] = _cumulative_unique_count(out, "account_id", "beneficiary_id")
    out["beneficiary_account_degree"] = _cumulative_unique_count(out, "beneficiary_id", "account_id")

    out["device_reuse_score"] = (out["device_account_count"] - 1).clip(lower=0) / 5
    out["beneficiary_fanout_score"] = (out["beneficiary_account_degree"] - 1).clip(lower=0) / 8
    out["network_concentration"] = out["account_beneficiary_degree"] / (out["beneficiary_account_degree"] + 1)

    out["account_outflow"] = _cumulative_sum(out, "account_id", "amount")
    out["beneficiary_inflow"] = _cumulative_sum(out, "beneficiary_id", "amount")
    out["account_to_beneficiary_share"] = (out["amount"] / (out["account_outflow"] + 1e-9)).clip(0, 1)
    out["beneficiary_amount_share"] = (out["amount"] / (out["beneficiary_inflow"] + 1e-9)).clip(0, 1)
    out["counterparty_count"] = out["account_beneficiary_degree"]
    out["network_amount_concentration"] = out["beneficiary_amount_share"]

    out["network_risk"] = (
        0.20 * out["device_reuse_score"].clip(0, 1)
        + 0.24 * out["beneficiary_fanout_score"].clip(0, 1)
        + 0.20 * out["network_concentration"].clip(0, 1)
        + 0.18 * (1 - out["beneficiary_amount_share"]).clip(0, 1)
        + 0.18 * (1 / (out["counterparty_count"] + 1)).clip(0, 1)
    ).clip(0, 1)
    return out
