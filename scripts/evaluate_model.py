import json
from pathlib import Path
from backend.app.generators.transaction import generate_transactions
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector


def main():
    df = generate_transactions(50_000, 829134)
    X = build_features(df)
    detector = Detector().fit(X, df.ground_truth)
    metrics = detector.evaluate(X, df.ground_truth)
    Path("ml/results").mkdir(parents=True, exist_ok=True)
    Path("ml/results/baseline_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))

if __name__ == "__main__":
    main()
