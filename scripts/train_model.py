from __future__ import annotations

import json
from pathlib import Path

from sklearn.model_selection import train_test_split

from backend.app.detection.model import Detector
from backend.app.evaluation.metrics import select_operating_threshold
from backend.app.features.pipeline import build_features
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks

SEED = 829134
EVENTS = 50_000
MODEL_PATH = Path("ml/models/detector.joblib")
RESULT_PATH = Path("ml/results/training.json")


def main() -> None:
    attacks = load_attacks()
    attack_ids = [attack.id for attack in attacks]
    df = generate_attack_scenario(EVENTS, SEED, attack_ids, .12, "high", "static", "medium")
    X = build_features(df)

    train_idx, valid_idx = train_test_split(
        range(len(df)),
        test_size=.20,
        random_state=SEED,
        stratify=df["ground_truth"],
    )
    model = Detector().fit(X.iloc[train_idx], df.ground_truth.iloc[train_idx])
    valid_scores = model.predict_scores(X.iloc[valid_idx])
    operating = select_operating_threshold(df.ground_truth.iloc[valid_idx], valid_scores, .02)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    RESULT_PATH.parent.mkdir(parents=True, exist_ok=True)
    model.save(MODEL_PATH)
    (MODEL_PATH.parent / "feature_schema.json").write_text(json.dumps(model.feature_names, indent=2), encoding="utf-8")
    (MODEL_PATH.parent / "model_metadata.json").write_text(json.dumps({
        "version": Detector.VERSION,
        "seed": SEED,
        "training_events": len(train_idx),
        "validation_events": len(valid_idx),
        "operating_threshold": operating["threshold"],
        "operating_metrics": operating,
        "features": model.feature_names,
        "feature_importance": model.feature_importance_,
    }, indent=2), encoding="utf-8")
    RESULT_PATH.write_text(json.dumps({
        "seed": SEED,
        "events": EVENTS,
        "model_version": Detector.VERSION,
        "operating_threshold": operating["threshold"],
        "validation_metrics": operating,
    }, indent=2), encoding="utf-8")
    print(json.dumps({"model_version": Detector.VERSION, "operating": operating}, indent=2))


if __name__ == "__main__":
    main()
