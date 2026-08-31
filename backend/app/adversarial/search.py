from __future__ import annotations
import pandas as pd
from .mutation import mutate
from ..features.pipeline import build_features


def search_hard_variants(detector, fraud_events: pd.DataFrame, seed: int, rounds: int = 4, population: int = 8):
    """Search synthetic feature variants with high fraud ground truth and low detector risk.

    This is a defensive robustness test over synthetic telemetry. It never interacts
    with a real payment system and does not generate operational attack instructions.
    """
    current = fraud_events.copy()
    history = []
    for r in range(rounds):
        candidates = [mutate(current, seed + r * 100 + i, strength=.08 + .06 * r) for i in range(population)]
        scored = []
        for candidate in candidates:
            scores = detector.predict_scores(build_features(candidate))
            c = candidate.copy()
            c["risk_score"] = scores
            scored.append(c)
        pool = pd.concat(scored, ignore_index=True)
        pool = pool.sort_values("risk_score", ascending=True)
        current = pool.head(max(10, min(len(pool), len(fraud_events)))).drop(columns=["risk_score"])
        history.append({
            "round": r + 1,
            "candidates": len(pool),
            "mean_risk": float(pool.risk_score.mean()),
            "lowest_risk": float(pool.risk_score.min()),
        })
    return current, history
