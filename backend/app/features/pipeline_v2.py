from __future__ import annotations
import numpy as np
import pandas as pd
from .graph import derive_network_features

NUMERIC_FEATURES=[
    "amount","velocity_1h","velocity_24h","geo_distance_km","beneficiary_age_days",
    "device_trust_score","behavioral_deviation","merchant_risk","identity_consistency",
    "shared_device_count","beneficiary_novelty","network_fan_in","network_fan_out","content_risk"
]
GRAPH_FEATURES=[
    "account_transaction_count","beneficiary_transaction_count","device_account_count",
    "merchant_account_count","account_beneficiary_degree","beneficiary_account_degree","network_concentration"
]

def build_features(df: pd.DataFrame)->pd.DataFrame:
    x=derive_network_features(df)[NUMERIC_FEATURES+GRAPH_FEATURES].copy()
    x["amount_log"]=np.log1p(x["amount"])
    x["velocity_ratio"]=x["velocity_1h"]/(x["velocity_24h"]+1)
    x["new_beneficiary"]=(x["beneficiary_age_days"]<14).astype(int)
    x["low_device_trust"]=(x["device_trust_score"]<.5).astype(int)
    x["network_degree"]=x["network_fan_in"]+x["network_fan_out"]
    x["network_imbalance"]=abs(x["network_fan_in"]-x["network_fan_out"])/(x["network_degree"]+1)
    x["combined_behavior_risk"]=.35*x["behavioral_deviation"]+.20*(1-x["device_trust_score"])+.15*x["merchant_risk"]+.15*x["content_risk"]+.15*(1-x["identity_consistency"])
    return x.replace([np.inf,-np.inf],0).fillna(0)
