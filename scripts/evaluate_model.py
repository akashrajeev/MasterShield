from __future__ import annotations

import json
import time
from pathlib import Path

from sklearn.model_selection import train_test_split

from backend.app.detection.model import Detector
from backend.app.evaluation.metrics import metrics_by_group, threshold_sweep
from backend.app.features.pipeline import build_features
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks

SEED = 829134
EVENTS = 50_000


def main() -> None:
    attacks = load_attacks()
    by_id = {attack.id: attack for attack in attacks}
    attack_ids = list(by_id)
    df = generate_attack_scenario(EVENTS, SEED, attack_ids, .12, "high", "static", "medium")
    X = build_features(df)
    train_idx, test_idx = train_test_split(
        range(len(df)), test_size=.25, random_state=SEED, stratify=df["ground_truth"]
    )
    model = Detector().fit(X.iloc[train_idx], df.ground_truth.iloc[train_idx])

    start = time.perf_counter()
    scores = model.predict_scores(X.iloc[test_idx])
    elapsed_ms = (time.perf_counter() - start) * 1000
    test_frame = df.iloc[test_idx].reset_index(drop=True).copy()
    test_frame["attack_family"] = test_frame["attack_id"].map(lambda value: by_id.get(value).family if value in by_id else "benign")
    test_frame["attack_difficulty"] = test_frame["attack_id"].map(lambda value: by_id.get(value).difficulty if value in by_id else "none")

    result = {
        "seed": SEED,
        "attack_count": len(attacks),
        "events": EVENTS,
        "test_events": len(test_idx),
        "model_version": Detector.VERSION,
        "metrics": model.evaluate(X.iloc[test_idx], df.ground_truth.iloc[test_idx]),
        "threshold_sweep": threshold_sweep(df.ground_truth.iloc[test_idx], scores),
        "by_attack": metrics_by_group(test_frame, scores, "attack_id"),
        "by_family": metrics_by_group(test_frame, scores, "attack_family"),
        "by_difficulty": metrics_by_group(test_frame, scores, "attack_difficulty"),
        "by_rail": metrics_by_group(test_frame, scores, "rail"),
        "inference_ms": elapsed_ms,
        "inference_ms_per_event": elapsed_ms / max(len(test_idx), 1),
    }
    Path("ml/results").mkdir(parents=True, exist_ok=True)
    Path("ml/results/evaluation.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
