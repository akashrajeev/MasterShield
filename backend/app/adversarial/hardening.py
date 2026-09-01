from __future__ import annotations

import pandas as pd
from sklearn.model_selection import train_test_split

from ..detection.model import Detector
from ..evaluation.metrics import binary_metrics, select_operating_threshold
from ..features.pipeline import build_features
from .search import search_hard_variants

CALIBRATION_MAX_FPR = 0.05


def _fit_calibrated_model(
    dataset: pd.DataFrame,
    seed: int,
    features: pd.DataFrame | None = None,
) -> tuple[Detector, float]:
    """Fit a detector and choose its operating threshold on a held-out training-only calibration split."""
    feature_matrix = features if features is not None else build_features(dataset)
    fit_idx, calibration_idx = train_test_split(
        dataset.index,
        test_size=.20,
        random_state=seed,
        stratify=dataset["ground_truth"],
    )
    model = Detector().fit(feature_matrix.loc[fit_idx], dataset.loc[fit_idx, "ground_truth"])
    calibration_scores = model.predict_scores(feature_matrix.loc[calibration_idx])
    operating = select_operating_threshold(
        dataset.loc[calibration_idx, "ground_truth"],
        calibration_scores,
        max_false_positive_rate=CALIBRATION_MAX_FPR,
    )
    return model, float(operating["threshold"])


def harden_detector(dataset: pd.DataFrame, seed: int, rounds: int = 3) -> dict:
    """Run red-team search while keeping one fixed operating policy for before/after comparison."""
    # Build causal/history features once over the complete original event history.
    # This preserves prior-event context for every untouched test event.
    full_features = build_features(dataset)
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

    train_features = full_features.loc[train.index]
    model, threshold = _fit_calibrated_model(train, seed, train_features)
    baseline_scores = model.predict_scores(full_features.loc[test.index])
    baseline = binary_metrics(test["ground_truth"], baseline_scores, threshold)
    history = [{
        "round": 0,
        "metrics": baseline,
        "operating_threshold": threshold,
        "calibration_max_fpr": CALIBRATION_MAX_FPR,
        "threshold_policy": "fixed_baseline",
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
        augmented_features = build_features(augmented)
        model, _ = _fit_calibrated_model(augmented, seed + round_no * 1000, augmented_features)
        # Keep the original operating policy fixed. Recalibrating after adding
        # hard cases can hide regressions by moving the decision boundary.
        test_scores = model.predict_scores(full_features.loc[test.index])
        metrics = binary_metrics(test["ground_truth"], test_scores, threshold)
        history.append({
            "round": round_no,
            "metrics": metrics,
            "operating_threshold": threshold,
            "calibration_max_fpr": CALIBRATION_MAX_FPR,
            "threshold_policy": "fixed_baseline",
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
