from __future__ import annotations

import numpy as np
import pandas as pd

from ..simulation.entities import create_entity_world

RAILS = ["UPI", "CARD", "WALLET", "IMPS", "NEFT", "RTGS", "BNPL", "CROSS_BORDER"]


def generate_transactions(
    events: int,
    seed: int,
    fraud_rate: float = 0.12,
    attack_ids: list[str] | None = None,
    entity_count: int | None = None,
) -> pd.DataFrame:
    """Generate a reproducible synthetic payment history.

    Fraud labels are coupled to observable deviations rather than being random-only.
    All entities and values are synthetic and safe for offline defensive research.
    """
    rng = np.random.default_rng(seed)
    attack_ids = attack_ids or ["GENERIC-01"]
    n_entities = entity_count or max(1000, min(10000, events // 2))
    world = create_entity_world(seed, n_entities)

    account = world.accounts.iloc[rng.integers(0, len(world.accounts), events)].reset_index(drop=True)
    merchant = world.merchants.iloc[rng.integers(0, len(world.merchants), events)].reset_index(drop=True)
    device = world.devices.iloc[rng.integers(0, len(world.devices), events)].reset_index(drop=True)
    beneficiary = world.beneficiaries.iloc[rng.integers(0, len(world.beneficiaries), events)].reset_index(drop=True)

    # Ordered timestamps are necessary for history-dependent velocity features.
    start = pd.Timestamp("2026-01-01", tz="UTC")
    timestamps = start + pd.to_timedelta(np.cumsum(rng.exponential(55, events)), unit="s")

    amount = np.clip(rng.normal(account["normal_amount_mean"].to_numpy(), account["normal_amount_std"].to_numpy()), 20, 500000)
    amount = np.round(amount, 2)
    rail = rng.choice(RAILS, events, p=[.38, .25, .12, .1, .06, .04, .03, .02])

    df = pd.DataFrame({
        "transaction_id": [f"TXN_{i:08d}" for i in range(events)],
        "timestamp": timestamps,
        "account_id": account["account_id"].astype(int),
        "customer_id": account["customer_id"].astype(int),
        "merchant_id": merchant["merchant_id"].astype(int),
        "device_id": device["device_id"].astype(int),
        "beneficiary_id": beneficiary["beneficiary_id"].astype(int),
        "amount": amount,
        "rail": rail,
        "home_city": account["home_city"].to_numpy(),
        "merchant_city": merchant["merchant_city"].to_numpy(),
        "account_age_days": account["account_age_days"].astype(int).to_numpy(),
        "normal_daily_txns": account["normal_daily_txns"].astype(int).to_numpy(),
        "normal_amount_mean": account["normal_amount_mean"].to_numpy(),
        "beneficiary_age_days": beneficiary["beneficiary_age_days"].astype(int).to_numpy(),
        "device_trust_score": device["device_trust_score"].to_numpy(),
        "merchant_risk": merchant["merchant_risk"].to_numpy(),
        "ground_truth": (rng.random(events) < fraud_rate).astype(int),
    })

    # Derive history-aware velocity from event timestamps.
    df = df.sort_values("timestamp").reset_index(drop=True)
    grouped = df.groupby("account_id", sort=False)
    df["velocity_1h"] = grouped["transaction_id"].transform(lambda s: s.rolling(8, min_periods=1).count() - 1).astype(float)
    df["velocity_24h"] = grouped["transaction_id"].transform(lambda s: s.rolling(32, min_periods=1).count() - 1).astype(float)

    # Baseline amount deviation using the account's synthetic historical expectation.
    df["amount_zscore"] = ((df["amount"] - df["normal_amount_mean"]) / (df["normal_amount_std"] + 1)).abs()
    df["behavioral_deviation"] = np.clip(df["amount_zscore"] / 6 + df["velocity_1h"] / (df["normal_daily_txns"] + 8), 0, 1)
    df["geo_distance_km"] = np.where(df["home_city"].eq(df["merchant_city"]), rng.exponential(3, events), rng.exponential(55, events))

    fraud_idx = df.index[df["ground_truth"].eq(1)]
    if len(fraud_idx):
        # Correlated but bounded telemetry perturbations create realistic overlap with benign behavior.
        strength = rng.uniform(.45, 1.0, len(fraud_idx))
        df.loc[fraud_idx, "amount"] *= rng.uniform(1.1, 4.5, len(fraud_idx))
        df.loc[fraud_idx, "velocity_1h"] += rng.poisson(3 * strength + .5)
        df.loc[fraud_idx, "velocity_24h"] += rng.poisson(10 * strength + 1)
        df.loc[fraud_idx, "beneficiary_age_days"] = rng.integers(0, 30, len(fraud_idx))
        df.loc[fraud_idx, "device_trust_score"] *= rng.uniform(.25, .9, len(fraud_idx))
        df.loc[fraud_idx, "merchant_risk"] = np.clip(df.loc[fraud_idx, "merchant_risk"] + rng.beta(3, 4, len(fraud_idx)) * .65, 0, 1)
        df.loc[fraud_idx, "behavioral_deviation"] = np.clip(df.loc[fraud_idx, "behavioral_deviation"] + rng.beta(3, 3, len(fraud_idx)) * .7, 0, 1)
        df.loc[fraud_idx, "geo_distance_km"] += rng.exponential(25, len(fraud_idx))
        df.loc[fraud_idx, "attack_id"] = rng.choice(attack_ids, len(fraud_idx))
    else:
        df["attack_id"] = None
    return df
