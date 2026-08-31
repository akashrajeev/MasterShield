from __future__ import annotations

import pandas as pd
from sklearn.model_selection import train_test_split

from ..detection.model import Detector
from ..evaluation.metrics import binary_metrics
from ..features.pipeline import build_features
from .search import search_hard_variants


def harden_detector(dataset: pd.DataFrame, seed: int, rounds: int = 3) -> dict:
    """Run red-team search on a validation pool and score hardening on an untouched test set."""
    train, remainder = train_test_split(dataset, test_size=.40, random_state=seed, stratify=dataset["ground_truth"])
    red_team, test = train_test_split(remainder, test_size=.50, random_state=seed + 1, stratify=remainder["ground_truth"])
    model = Detector().fit(build_features(train), train["ground_truth"])
    baseline_scores = model.predict_scores(build_features(test))
    baseline = binary_metrics(test["ground_truth"], baseline_scores)
    history = [{"round": 0, "metrics": baseline, "adversarial_examples": 0}]
    augmented = train.copy()

    for round_no in range(1, rounds + 1):
        source = red_team[red_team["ground_truth"] == 1].copy()
        hard, search_history = search_hard_variants(model, source, seed + round_no * 1000, rounds=2, population=6)
        hard["ground_truth"] = 1
        augmented = pd.concat([augmented, hard], ignore_index=True)
        model = Detector().fit(build_features(augmented), augmented["ground_truth"])
        test_scores = model.predict_scores(build_features(test))
        metrics = binary_metrics(test["ground_truth"], test_scores)
        history.append({
            "round": round_no,
            "metrics": metrics,
            "adversarial_examples": len(hard),
            "search": search_history,
        })
    return {
        "baseline": baseline,
        "rounds": history,
        "final_detector": model,
        "train_events": len(augmented),
        "red_team_events": len(red_team),
        "untouched_test_events": len(test),
    }
