from __future__ import annotations

import numpy as np
import pandas as pd

from backend.app.detection.model import Detector
from backend.app.features.pipeline import build_features
from .mutation import mutate


def find_hard_variants(
    df: pd.DataFrame,
    detector: Detector,
    seed: int,
    rounds: int = 3,
    population: int = 6,
    keep: int = 25,
) -> list[dict]:
    """Search synthetic fraud variants that minimize detector risk."""
    population_df = df[df["ground_truth"] == 1].copy()
    findings: list[dict] = []
    if population_df.empty:
        return findings
    for round_no in range(1, rounds + 1):
        population_df = mutate(population_df, seed + round_no * 104729, strength=.08 + .07 * round_no, round_no=round_no)
        scores = detector.predict_scores(build_features(population_df))
        population_df = population_df.copy()
        population_df["risk_score"] = scores
        population_df["detector_missed"] = (scores < .5).astype(int)
        order = np.argsort(scores)[: min(keep, len(scores))]
        for i in order:
            row = population_df.iloc[i]
            findings.append({
                "round": round_no,
                "transaction_id": str(row["transaction_id"]),
                "attack_id": None if pd.isna(row.get("attack_id")) else str(row.get("attack_id")),
                "risk_score": float(scores[i]),
                "detector_missed": bool(scores[i] < .5),
                "mutation_seed": int(row["mutation_seed"]),
                "difficulty_proxy": float(1.0 - scores[i]),
            })
    findings.sort(key=lambda x: x["risk_score"])
    return findings
