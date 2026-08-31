from __future__ import annotations

from dataclasses import dataclass
import numpy as np
import pandas as pd


@dataclass(frozen=True)
class EntityWorld:
    customers: pd.DataFrame
    accounts: pd.DataFrame
    merchants: pd.DataFrame
    devices: pd.DataFrame
    beneficiaries: pd.DataFrame


RAILS = ["UPI", "CARD", "WALLET", "IMPS", "NEFT", "RTGS", "BNPL", "CROSS_BORDER"]
CITIES = ["Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Chennai", "Pune", "Kochi", "Kolkata"]
MERCHANT_TYPES = ["grocery", "food", "travel", "electronics", "health", "utilities", "fashion", "services"]


def create_entity_world(seed: int, customers: int = 5000) -> EntityWorld:
    rng = np.random.default_rng(seed)
    customer_ids = np.arange(1, customers + 1)
    segments = rng.choice(["mass", "affluent", "student", "business"], customers, p=[.55, .2, .15, .1])
    customers_df = pd.DataFrame({
        "customer_id": customer_ids,
        "segment": segments,
        "city": rng.choice(CITIES, customers),
        "income_band": rng.choice(["low", "mid", "high"], customers, p=[.25, .6, .15]),
    })
    accounts = customers_df[["customer_id"]].copy()
    accounts["account_id"] = np.arange(1, customers + 1)
    accounts["account_age_days"] = rng.integers(30, 3650, customers)
    accounts["normal_daily_txns"] = np.maximum(1, rng.poisson(6, customers))
    accounts["normal_amount_mean"] = np.clip(rng.lognormal(7.1, .7, customers), 100, 100000)
    accounts["normal_amount_std"] = accounts["normal_amount_mean"] * rng.uniform(.25, .7, customers)
    accounts["preferred_rail"] = rng.choice(RAILS[:6], customers)
    accounts["home_city"] = customers_df["city"].values

    merchant_count = max(500, customers // 5)
    merchants = pd.DataFrame({
        "merchant_id": np.arange(1, merchant_count + 1),
        "merchant_category": rng.choice(MERCHANT_TYPES, merchant_count),
        "merchant_city": rng.choice(CITIES, merchant_count),
        "merchant_age_days": rng.integers(30, 5000, merchant_count),
        "merchant_ticket_mean": np.clip(rng.lognormal(6.5, .75, merchant_count), 50, 50000),
        "merchant_risk": np.clip(rng.beta(1.5, 8, merchant_count), 0, 1),
    })

    device_count = int(customers * 1.5)
    devices = pd.DataFrame({
        "device_id": np.arange(1, device_count + 1),
        "device_age_days": rng.integers(1, 2500, device_count),
        "device_trust_score": np.clip(rng.normal(.86, .12, device_count), 0, 1),
        "network_type": rng.choice(["mobile", "wifi", "corporate"], device_count, p=[.45, .5, .05]),
    })

    beneficiary_count = max(1000, customers // 2)
    beneficiaries = pd.DataFrame({
        "beneficiary_id": np.arange(1, beneficiary_count + 1),
        "beneficiary_age_days": rng.integers(1, 2500, beneficiary_count),
        "beneficiary_city": rng.choice(CITIES, beneficiary_count),
        "beneficiary_risk": np.clip(rng.beta(1.2, 8, beneficiary_count), 0, 1),
    })
    return EntityWorld(customers_df, accounts, merchants, devices, beneficiaries)
