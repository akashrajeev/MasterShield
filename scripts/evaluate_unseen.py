from __future__ import annotations

import json
from pathlib import Path

from backend.app.detection.model import Detector
from backend.app.evaluation.metrics import binary_metrics
from backend.app.features.pipeline import build_features
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks


def main() -> None:
    attacks = load_attacks()
    families = sorted({a.family for a in attacks})
    if len(families) < 2:
        raise RuntimeError("Need at least two attack families")
    holdout_families = set(families[-2:])
    train_attacks = [a.id for a in attacks if a.family not in holdout_families]
    test_attacks = [a.id for a in attacks if a.family in holdout_families]

    train_df = generate_attack_scenario(40000, 901001, train_attacks, .12, "high")
    test_df = generate_attack_scenario(20000, 901002, test_attacks, .12, "very-high")
    model = Detector().fit(build_features(train_df), train_df.ground_truth)
    scores = model.predict_scores(build_features(test_df))
    result = {
        "train_families": sorted({a.family for a in attacks if a.id in train_attacks}),
        "unseen_test_families": sorted(holdout_families),
        "train_events": len(train_df),
        "test_events": len(test_df),
        "metrics": binary_metrics(test_df.ground_truth, scores),
    }
    Path("ml/results").mkdir(parents=True, exist_ok=True)
    Path("ml/results/unseen_attack_evaluation.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
