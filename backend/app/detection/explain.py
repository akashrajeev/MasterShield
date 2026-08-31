from __future__ import annotations
import pandas as pd

SIGNAL_LABELS={
    "amount":"Amount deviation","velocity_1h":"1-hour velocity","velocity_24h":"24-hour velocity","geo_distance_km":"Geographic distance","beneficiary_age_days":"Beneficiary age","device_trust_score":"Device trust","behavioral_deviation":"Behavioral deviation","merchant_risk":"Merchant risk","identity_consistency":"Identity consistency","shared_device_count":"Shared device count","beneficiary_novelty":"Beneficiary novelty","network_fan_in":"Network fan-in","network_fan_out":"Network fan-out","content_risk":"Synthetic-content risk","combined_behavior_risk":"Combined behavior risk"
}

def explain_row(row: pd.Series, score: float, top_n: int=5)->list[dict]:
    candidates=[]
    for feature,label in SIGNAL_LABELS.items():
        if feature not in row: continue
        value=float(row[feature])
        # Normalize directions so larger contribution means stronger risk signal.
        risk = value if feature not in {"device_trust_score","identity_consistency"} else 1-value
        candidates.append((max(0.0,risk),feature,label,value))
    candidates.sort(reverse=True)
    total=sum(x[0] for x in candidates) or 1.0
    return [{"feature":f,"label":label,"value":round(v,4),"contribution":round(min(r/total,1.0),4)} for r,f,label,v in candidates[:top_n]]
