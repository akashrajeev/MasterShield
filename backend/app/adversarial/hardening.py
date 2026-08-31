from __future__ import annotations

import pandas as pd
from ..detection.model import Detector
from ..evaluation.metrics import binary_metrics
from ..features.pipeline import build_features
from .search import search_hard_variants


def harden_detector(base_train: pd.DataFrame, holdout: pd.DataFrame, seed: int, rounds: int = 3) -> dict:
    """Run a closed-loop defensive experiment over synthetic fraud telemetry."""
    detector = Detector().fit(build_features(base_train), base_train["ground_truth"])
    baseline_scores = detector.predict_scores(build_features(holdout))
    baseline = binary_metrics(holdout["ground_truth"], baseline_scores)
    history = [{"round": 0, "metrics": baseline, "adversarial_examples": 0}]
    train = base_train.copy()

    for round_no in range(1, rounds + 1):
        fraud = holdout[holdout["ground_truth"] == 1].copy()
        hard, search_history = search_hard_variants(detector, fraud, seed + round_no * 1000, rounds=2, population=6)
        hard["ground_truth"] = 1
        # Give the hard variants a small weight by duplication; this keeps the baseline stable
        # while forcing the model to see previously missed synthetic behavior.
        augmented = pd.concat([train, hard], ignore_index=True)
        detector = Detector().fit(build_features(augmented), augmented["ground_truth"])
        scores = detector.predict_scores(build_features(holdout))
        metrics = binary_metrics(holdout["ground_truth"], scores)
        history.append({
            "round": round_no,
            "metrics": metrics,
            "adversarial_examples": len(hard),
            "search": search_history,
        })
        train = augmented
    return {"baseline": baseline, "rounds": history, "final_detector": detector}
