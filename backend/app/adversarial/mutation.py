import numpy as np
import pandas as pd

MUTABLE = ["amount", "velocity_1h", "velocity_24h", "geo_distance_km", "beneficiary_age_days", "device_trust_score", "behavioral_deviation", "merchant_risk"]

def mutate(df: pd.DataFrame, seed: int, strength: float = .2) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    out = df.copy()
    for col in MUTABLE:
        scale = max(float(out[col].std()), 1e-6) * strength
        out[col] = out[col] + rng.normal(0, scale, len(out))
    out["velocity_1h"] = out["velocity_1h"].clip(0).round()
    out["velocity_24h"] = out["velocity_24h"].clip(0).round()
    out["geo_distance_km"] = out["geo_distance_km"].clip(0)
    out["beneficiary_age_days"] = out["beneficiary_age_days"].clip(0).round()
    out["device_trust_score"] = out["device_trust_score"].clip(0, 1)
    out["behavioral_deviation"] = out["behavioral_deviation"].clip(0, 1)
    out["merchant_risk"] = out["merchant_risk"].clip(0, 1)
    return out
