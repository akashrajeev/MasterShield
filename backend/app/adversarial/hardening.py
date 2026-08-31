from __future__ import annotations

import pandas as pd
from sklearn.model_selection import train_test_split

from ..detection.model import Detector
from ..evaluation.metrics import binary_metrics, select_operating_threshold
from ..features.pipeline import build_features
from .search import search_hard_variants


def _fit_calibrated_model(dataset: pd.DataFrame, seed: int) -> tuple[Detector, float]:
    """Fit on the full training population while selecting an operating threshold on a held-out calibration split."""
    fit, calibration = train_test_split(
        dataset,
        test_size=.20,
        random_state=seed,
        stratify=dataset["ground_truth"],
    )
    model = Detector().fit(build_features(fit), fit["ground_truth"])
    calibration_scores = model.predict_scores(build_features(calibration))
    operating = select_operating_threshold(
        calibration["ground_truth"], calibration_scores, max_false_positive_rate=.02
    )
    final_model = Detector().fit(build_features(dataset), dataset["ground_truth"])
    return final_model, float(operating["threshold"])


def harden_detector(dataset: pd.DataFrame, seed: int, rounds: int = 3) -> dict:
    """Run red-team search with calibrated operating points and an untouched final test set."""
    train, remainder = train_test_split(
        dataset,
        test_size=.40,
        random_state=seed,
        stratify=dataset["ground_truth"],
    )
    red_team, test = train_test_split(
        remainder,
        test_size=.50,
        random_state=seed + 1,
        stratify=remainder["ground_truth"],
    )

    model, threshold = _fit_calibrated_model(train, seed)
    baseline_scores = model.predict_scores(build_features(test))
    baseline = binary_metrics(test["ground_truth"], baseline_scores, threshold)
    history = [{
        "round": 0,
        "metrics": baseline,
        "operating_threshold": threshold,
        "adversarial_examples": 0,
    }]
    augmented = train.copy()

    for round_no in range(1, rounds + 1):
        source = red_team[red_team["ground_truth"] == 1].copy()
        hard, search_history = search_hard_variants(
            model,
            source,
            seed + round_no * 1000,
            rounds=2,
            population=6,
        )
        hard["ground_truth"] = 1
        augmented = pd.concat([augmented, hard], ignore_index=True)
        model, threshold = _fit_calibrated_model(augmented, seed + round_no * 1000)
        test_scores = model.predict_scores(build_features(test))
        metrics = binary_metrics(test["ground_truth"], test_scores, threshold)
        history.append({
            "round": round_no,
            "metrics": metrics,
            "operating_threshold": threshold,
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
