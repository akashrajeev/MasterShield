from __future__ import annotations

import json
from pathlib import Path
from sklearn.model_selection import train_test_split

from backend.app.detection.model import Detector
from backend.app.evaluation.metrics import metrics_by_group, threshold_sweep
from backend.app.features.pipeline import build_features
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks


def main() -> None:
    seed = 829134
    attacks = load_attacks()
    attack_ids = [a.id for a in attacks]
    df = generate_attack_scenario(50000, seed, attack_ids, .12, "high")
    X = build_features(df)
    train_idx, test_idx = train_test_split(range(len(df)), test_size=.25, random_state=seed, stratify=df["ground_truth"])
    x_train, x_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = df.ground_truth.iloc[train_idx], df.ground_truth.iloc[test_idx]
    model = Detector().fit(x_train, y_train)
    scores = model.predict_scores(x_test)
    result = {
        "seed": seed,
        "attack_count": len(attacks),
        "events": len(df),
        "test_events": len(x_test),
        "metrics": model.evaluate(x_test, y_test),
        "threshold_sweep": threshold_sweep(y_test, scores),
        "by_attack": metrics_by_group(df.iloc[test_idx].reset_index(drop=True), scores, "attack_id"),
        "by_rail": metrics_by_group(df.iloc[test_idx].reset_index(drop=True), scores, "rail"),
    }
    Path("ml/results").mkdir(parents=True, exist_ok=True)
    Path("ml/results/evaluation.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
