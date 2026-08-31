from __future__ import annotations

import json
from pathlib import Path

from backend.app.detection.model import Detector
from backend.app.features.pipeline import build_features
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks
from sklearn.model_selection import train_test_split


def main() -> None:
    attacks = load_attacks()
    ids = [a.id for a in attacks]
    df = generate_attack_scenario(50000, 829134, ids, .12, "high")
    X = build_features(df)
    x_train, _, y_train, _ = train_test_split(X, df["ground_truth"], test_size=.2, stratify=df["ground_truth"], random_state=829134)
    model = Detector().fit(x_train, y_train)
    Path("ml/models").mkdir(parents=True, exist_ok=True)
    Path("ml/results").mkdir(parents=True, exist_ok=True)
    model.save("ml/models/detector.joblib")
    Path("ml/models/feature_schema.json").write_text(json.dumps(model.feature_names, indent=2), encoding="utf-8")
    Path("ml/models/model_metadata.json").write_text(json.dumps({
        "version": Detector.VERSION,
        "training_events": len(x_train),
        "seed": 829134,
        "features": model.feature_names,
        "feature_importance": model.feature_importance_,
    }, indent=2), encoding="utf-8")
    print(f"trained MasterShield detector v{Detector.VERSION} on {len(x_train):,} synthetic events")


if __name__ == "__main__":
    main()
