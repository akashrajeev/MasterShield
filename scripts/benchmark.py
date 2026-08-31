from __future__ import annotations

import json
from pathlib import Path

from sklearn.model_selection import train_test_split

from backend.app.detection.model import Detector
from backend.app.evaluation.metrics import binary_metrics, metrics_by_group
from backend.app.features.pipeline import build_features
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks


def evaluate(events: int, seed: int, difficulty: str):
    attacks = load_attacks()
    df = generate_attack_scenario(events, seed, [a.id for a in attacks], .12, difficulty)
    train, test = train_test_split(
        df,
        test_size=.25,
        random_state=seed,
        stratify=df["ground_truth"],
    )
    model = Detector().fit(build_features(train), train.ground_truth)
    scores = model.predict_scores(build_features(test))
    return {
        "difficulty": difficulty,
        "split": {"train_fraction": .75, "test_fraction": .25, "stratified": True},
        "metrics": binary_metrics(test.ground_truth, scores),
        "by_rail": metrics_by_group(test.reset_index(drop=True), scores, "rail"),
    }


def main() -> None:
    results = [
        evaluate(12000, 700000 + i, level)
        for i, level in enumerate(["low", "medium", "high", "very-high"])
    ]
    payload = {"benchmarks": results}
    Path("ml/results").mkdir(parents=True, exist_ok=True)
    Path("ml/results/benchmark.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
