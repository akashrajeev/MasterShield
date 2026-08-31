from __future__ import annotations
import numpy as np
import pandas as pd
from backend.app.detection.model import Detector
from backend.app.features.pipeline import build_features
from .mutation import mutate

def find_hard_variants(df: pd.DataFrame, detector: Detector, seed: int, rounds: int = 3, keep: int = 25) -> list[dict]:
    population=df[df["ground_truth"]==1].copy()
    findings=[]
    if population.empty:
        return findings
    for r in range(rounds):
        population=mutate(population, seed+r*104729, strength=.15+.10*r)
        scores=detector.predict_scores(build_features(population))
        order=np.argsort(scores)[:min(keep,len(scores))]
        for i in order:
            findings.append({"round":r+1,"transaction_id":str(population.iloc[i]["transaction_id"]),"risk_score":float(scores[i])})
    return findings
