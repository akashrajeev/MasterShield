import pandas as pd

NUMERIC_FEATURES = [
    "amount", "velocity_1h", "velocity_24h", "geo_distance_km",
    "beneficiary_age_days", "device_trust_score", "behavioral_deviation", "merchant_risk"
]


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df[NUMERIC_FEATURES].copy()
    out["amount_log"] = (out["amount"] + 1).map(__import__('numpy').log1p)
    out["velocity_ratio"] = out["velocity_1h"] / (out["velocity_24h"] + 1)
    out["new_beneficiary"] = (out["beneficiary_age_days"] < 14).astype(int)
    out["low_device_trust"] = (out["device_trust_score"] < .5).astype(int)
    return out.replace([float("inf"), float("-inf")], 0).fillna(0)
