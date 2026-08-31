import json
from pathlib import Path
from sklearn.model_selection import train_test_split
from backend.app.identify.catalog import load_attacks
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector
from backend.app.adversarial.search import search_hard_variants

if __name__ == '__main__':
    seed = 829134
    attacks = load_attacks()
    attack_ids = [a.id for a in attacks]
    base = generate_attack_scenario(20_000, seed, attack_ids, .12, "high")
    X = build_features(base)
    X_train, X_test, y_train, y_test = train_test_split(X, base.ground_truth, test_size=.25, random_state=seed, stratify=base.ground_truth)
    detector = Detector().fit(X_train, y_train)
    baseline = detector.evaluate(X_test, y_test)

    fraud = base[base.ground_truth == 1].copy()
    hard, history = search_hard_variants(detector, fraud, seed + 1, rounds=4, population=6)
    hard_scores = detector.predict_scores(build_features(hard))
    hard_summary = {
        "hard_variant_count": len(hard),
        "mean_risk": float(hard_scores.mean()),
        "lowest_risk": float(hard_scores.min()),
        "below_50pct_risk": float((hard_scores < .5).mean()),
    }
    result = {"seed": seed, "attack_count": len(attacks), "baseline": baseline, "red_team_search": history, "hard_variants": hard_summary}
    Path("ml/results").mkdir(parents=True, exist_ok=True)
    Path("ml/results/closed_loop.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
