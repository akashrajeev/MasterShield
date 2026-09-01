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
) -> tuple[Detector, float, pd.Index]:
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
    return model, float(operating["threshold"]), calibration_idx


def harden_detector(dataset: pd.DataFrame, seed: int, rounds: int = 3) -> dict:
    """Iteratively train on selected synthetic hard cases and keep only improvements."""
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
    model, threshold, calibration_idx = _fit_calibrated_model(train, seed, train_features)
    calibration_features = train_features.loc[calibration_idx]
    calibration_labels = train.loc[calibration_idx, "ground_truth"]
    champion_dev = binary_metrics(
        calibration_labels,
        model.predict_scores(calibration_features),
        threshold,
    )

    baseline_scores = model.predict_scores(full_features.loc[test.index])
    baseline = binary_metrics(test["ground_truth"], baseline_scores, threshold)
    history = [{
        "round": 0,
        "metrics": baseline,
        "development_metrics": champion_dev,
        "operating_threshold": threshold,
        "calibration_max_fpr": CALIBRATION_MAX_FPR,
        "threshold_policy": "fixed_baseline",
        "promotion": "baseline",
        "adversarial_examples": 0,
    }]
    fit_population = train.loc[train.index.difference(calibration_idx)].copy()

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
        candidate_training = pd.concat([fit_population, hard], ignore_index=True)
        candidate_features = build_features(candidate_training)
        candidate = Detector().fit(candidate_features, candidate_training["ground_truth"])
        candidate_dev = binary_metrics(
            calibration_labels,
            candidate.predict_scores(calibration_features),
            threshold,
        )

        promoted = candidate_dev["f1"] >= champion_dev["f1"]
        if promoted:
            model = candidate
            champion_dev = candidate_dev
            promotion = "candidate"
        else:
            promotion = "rejected_no_improvement"

        test_scores = model.predict_scores(full_features.loc[test.index])
        metrics = binary_metrics(test["ground_truth"], test_scores, threshold)
        history.append({
            "round": round_no,
            "metrics": metrics,
            "development_metrics": champion_dev,
            "candidate_development_metrics": candidate_dev,
            "operating_threshold": threshold,
            "calibration_max_fpr": CALIBRATION_MAX_FPR,
            "threshold_policy": "fixed_baseline",
            "promotion": promotion,
            "adversarial_examples": len(hard),
            "search": search_history,
        })

    return {
        "baseline": baseline,
        "rounds": history,
        "final_detector": model,
        "train_events": len(fit_population),
        "red_team_events": len(red_team),
        "untouched_test_events": len(test),
    }
