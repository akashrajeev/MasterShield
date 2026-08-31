from __future__ import annotations

import numpy as np
import pandas as pd

from ..simulation.entities import create_entity_world

RAILS = ["UPI", "CARD", "WALLET", "IMPS", "NEFT", "RTGS", "BNPL", "CROSS_BORDER"]
RAIL_PROBABILITIES = np.array([.38, .25, .12, .10, .06, .04, .03, .02])


def _time_window_counts(df: pd.DataFrame, seconds: int) -> pd.Series:
    """Count prior transactions for the same account inside a true time window."""
    values = np.zeros(len(df), dtype=float)
    epoch = df["timestamp"].astype("int64").to_numpy()
    for _, positions in df.groupby("account_id", sort=False).groups.items():
        idx = np.asarray(list(positions), dtype=int)
        ts = epoch[idx]
        left = np.searchsorted(ts, ts - seconds * 1_000_000_000, side="left")
        values[idx] = np.arange(len(idx)) - left
    return pd.Series(values, index=df.index)


def generate_transactions(
    events: int,
    seed: int,
    fraud_rate: float = 0.12,
    attack_ids: list[str] | None = None,
    entity_count: int | None = None,
) -> pd.DataFrame:
    """Generate a reproducible synthetic payment history with causal behavior signals."""
    if events < 1:
        raise ValueError("events must be positive")
    rng = np.random.default_rng(seed)
    attack_ids = attack_ids or ["GENERIC-01"]
    n_entities = entity_count or max(1000, min(10000, events // 2))
    world = create_entity_world(seed, n_entities)

    account = world.accounts.iloc[rng.integers(0, len(world.accounts), events)].reset_index(drop=True)
    merchant = world.merchants.iloc[rng.integers(0, len(world.merchants), events)].reset_index(drop=True)
    device = world.devices.iloc[rng.integers(0, len(world.devices), events)].reset_index(drop=True)
    beneficiary = world.beneficiaries.iloc[rng.integers(0, len(world.beneficiaries), events)].reset_index(drop=True)

    start = pd.Timestamp("2026-01-01", tz="UTC")
    timestamps = start + pd.to_timedelta(np.cumsum(rng.exponential(55, events)), unit="s")
    rail = rng.choice(RAILS, events, p=RAIL_PROBABILITIES)

    amount = np.clip(
        rng.normal(account["normal_amount_mean"].to_numpy(), account["normal_amount_std"].to_numpy()),
        20,
        500000,
    )

    df = pd.DataFrame({
        "transaction_id": [f"TXN_{i:08d}" for i in range(events)],
        "timestamp": timestamps,
        "account_id": account["account_id"].astype(int).to_numpy(),
        "customer_id": account["customer_id"].astype(int).to_numpy(),
        "merchant_id": merchant["merchant_id"].astype(int).to_numpy(),
        "device_id": device["device_id"].astype(int).to_numpy(),
        "beneficiary_id": beneficiary["beneficiary_id"].astype(int).to_numpy(),
        "amount": np.round(amount, 2),
        "rail": rail,
        "home_city": account["home_city"].to_numpy(),
        "merchant_city": merchant["merchant_city"].to_numpy(),
        "account_age_days": account["account_age_days"].astype(int).to_numpy(),
        "normal_daily_txns": account["normal_daily_txns"].astype(int).to_numpy(),
        "normal_amount_mean": account["normal_amount_mean"].to_numpy(),
        "normal_amount_std": account["normal_amount_std"].to_numpy(),
        "beneficiary_age_days": beneficiary["beneficiary_age_days"].astype(int).to_numpy(),
        "device_trust_score": device["device_trust_score"].to_numpy(),
        "merchant_risk": merchant["merchant_risk"].to_numpy(),
        "ground_truth": (rng.random(events) < fraud_rate).astype(int),
    })

    df = df.sort_values("timestamp").reset_index(drop=True)
    df["velocity_1h"] = _time_window_counts(df, 3600).to_numpy()
    df["velocity_24h"] = _time_window_counts(df, 86400).to_numpy()

    df["amount_zscore"] = ((df["amount"] - df["normal_amount_mean"]) / (df["normal_amount_std"] + 1)).abs()
    df["behavioral_deviation"] = np.clip(
        df["amount_zscore"] / 6
        + df["velocity_1h"] / (df["normal_daily_txns"] + 8),
        0,
        1,
    )
    df["geo_distance_km"] = np.where(
        df["home_city"].eq(df["merchant_city"]),
        rng.exponential(3, events),
        rng.exponential(55, events),
    )
    df["attack_id"] = None
    return df
