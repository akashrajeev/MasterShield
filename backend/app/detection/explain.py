from __future__ import annotations

import pandas as pd

SIGNAL_LABELS = {
    "amount_zscore": "Amount deviation",
    "velocity_1h": "1-hour velocity",
    "velocity_24h": "24-hour velocity",
    "geo_distance_km": "Geographic distance",
    "beneficiary_age_days": "Beneficiary age",
    "device_trust_score": "Device trust",
    "behavioral_deviation": "Behavioral deviation",
    "merchant_risk": "Merchant risk",
    "network_risk": "Network risk",
    "device_reuse_score": "Device reuse",
    "beneficiary_fanout_score": "Beneficiary fan-out",
    "urgency_score": "Urgency signal",
    "approval_path_change": "Approval-path change",
    "content_risk": "Synthetic-content risk",
    "cross_rail_activity": "Cross-rail activity",
}


def explain_row(row: pd.Series, score: float, top_n: int = 6) -> list[dict]:
    """Return human-readable observable risk signals for a synthetic event."""
    candidates = []
    for feature, label in SIGNAL_LABELS.items():
        if feature not in row:
            continue
        value = float(row[feature])
        # Higher trust / older beneficiaries are lower-risk directions.
        risk = 1.0 - value if feature in {"device_trust_score"} else value
        candidates.append((max(0.0, risk), feature, label, value))
    candidates.sort(reverse=True)
    total = sum(x[0] for x in candidates) or 1.0
    return [
        {
            "feature": feature,
            "label": label,
            "value": round(value, 4),
            "contribution": round(min(risk / total, 1.0), 4),
        }
        for risk, feature, label, value in candidates[:top_n]
    ]
