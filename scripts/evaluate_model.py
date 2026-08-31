import json
from pathlib import Path
from sklearn.model_selection import train_test_split
from backend.app.identify.catalog import load_attacks
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector


def main():
    seed = 829134
    attacks = load_attacks()
    df = generate_attack_scenario(50_000, seed, [a.id for a in attacks], .12, "high")
    X = build_features(df)
    X_train, X_test, y_train, y_test = train_test_split(X, df.ground_truth, test_size=.25, random_state=seed, stratify=df.ground_truth)
    detector = Detector().fit(X_train, y_train)
    metrics = detector.evaluate(X_test, y_test)
    result = {"seed": seed, "attack_count": len(attacks), "events": len(df), "test_events": len(X_test), "metrics": metrics}
    Path("ml/results").mkdir(parents=True, exist_ok=True)
    Path("ml/results/baseline_metrics.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
