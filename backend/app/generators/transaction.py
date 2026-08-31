import numpy as np
import pandas as pd

RAILS = ["UPI", "CARD", "WALLET", "IMPS", "NEFT", "RTGS"]


def generate_transactions(events: int, seed: int, fraud_rate: float = 0.12, attack_ids=None) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    attack_ids = attack_ids or ["GENERIC-01"]
    fraud = rng.random(events) < fraud_rate
    df = pd.DataFrame({
        "transaction_id": [f"TXN_{i:08d}" for i in range(events)],
        "account_id": rng.integers(1, 5001, events),
        "merchant_id": rng.integers(1, 1001, events),
        "device_id": rng.integers(1, 8001, events),
        "amount": np.round(np.exp(rng.normal(7.0, 1.0, events)), 2),
        "velocity_1h": rng.poisson(1.4, events),
        "velocity_24h": rng.poisson(7.0, events),
        "geo_distance_km": np.round(rng.exponential(8, events), 3),
        "beneficiary_age_days": rng.integers(0, 1500, events),
        "device_trust_score": np.clip(rng.normal(.82, .18, events), 0, 1),
        "behavioral_deviation": np.clip(rng.beta(1.5, 8, events), 0, 1),
        "merchant_risk": np.clip(rng.beta(1.5, 7, events), 0, 1),
        "rail": rng.choice(RAILS, events),
        "ground_truth": fraud.astype(int),
    })
    # Inject correlated fraud signals rather than random labels.
    idx = np.flatnonzero(fraud)
    df.loc[idx, "velocity_1h"] += rng.poisson(4, len(idx))
    df.loc[idx, "velocity_24h"] += rng.poisson(12, len(idx))
    df.loc[idx, "geo_distance_km"] += rng.exponential(40, len(idx))
    df.loc[idx, "beneficiary_age_days"] = rng.integers(0, 20, len(idx))
    df.loc[idx, "device_trust_score"] *= rng.uniform(.2, .8, len(idx))
    df.loc[idx, "behavioral_deviation"] = np.clip(df.loc[idx, "behavioral_deviation"] + rng.beta(4, 2, len(idx))*.7, 0, 1)
    df.loc[idx, "merchant_risk"] = np.clip(df.loc[idx, "merchant_risk"] + rng.beta(3, 3, len(idx))*.6, 0, 1)
    df["attack_id"] = None
    if len(idx):
        df.loc[idx, "attack_id"] = rng.choice(attack_ids, len(idx))
    return df
