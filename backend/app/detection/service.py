from __future__ import annotations

from pathlib import Path
from threading import Lock
from typing import Any

import pandas as pd

from .model import Detector
from ..features.pipeline import build_features
from ..generators.scenarios import generate_attack_scenario
from ..identify.catalog import load_attacks

MODEL_PATH = Path("ml/models/detector.joblib")
_lock = Lock()
_cached_model: Detector | None = None
_cached_mtime_ns: int | None = None


def _load_saved_model() -> Detector | None:
    global _cached_model, _cached_mtime_ns
    if not MODEL_PATH.exists():
        return None
    mtime = MODEL_PATH.stat().st_mtime_ns
    if _cached_model is None or _cached_mtime_ns != mtime:
        with _lock:
            if _cached_model is None or _cached_mtime_ns != mtime:
                _cached_model = Detector.load(MODEL_PATH)
                _cached_mtime_ns = mtime
    return _cached_model


def get_model(seed: int = 829134, train_events: int = 12000) -> Detector:
    saved = _load_saved_model()
    if saved is not None:
        return saved
    attacks = load_attacks()
    train = generate_attack_scenario(
        train_events,
        seed + 99,
        [attack.id for attack in attacks],
        .12,
        "high",
        "static",
        "medium",
    )
    return Detector().fit(build_features(train), train.ground_truth)


def assess_frame(df: pd.DataFrame, threshold: float = .5, seed: int = 829134) -> list[dict[str, Any]]:
    model = get_model(seed=seed)
    features = build_features(df)
    scores = model.predict_scores(features)
    decisions = model.decisions(scores, threshold)
    output: list[dict[str, Any]] = []
    for i, (_, row) in enumerate(df.reset_index(drop=True).iterrows()):
        explanation = model.explain(features.iloc[i], float(scores[i]), threshold)
        output.append({
            "transaction_id": str(row.get("transaction_id", f"ROW_{i}")),
            "risk_score": float(scores[i]),
            "decision": decisions[i],
            "prediction": int(scores[i] >= threshold),
            "ground_truth": int(row.get("ground_truth", 0)),
            "attack_id": row.get("attack_id"),
            "attack_family": row.get("attack_family"),
            "top_signals": explanation["top_signals"],
        })
    return output
