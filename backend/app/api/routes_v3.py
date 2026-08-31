from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import math
import time

import pandas as pd
from fastapi import APIRouter, HTTPException
from sklearn.model_selection import train_test_split

from ..adversarial.hardening import harden_detector
from ..adversarial.search_v2 import find_hard_variants
from ..detection.explain import explain_row
from ..detection.model import Detector
from ..detection.service import assess_frame, get_model
from ..evaluation.metrics import metrics_by_group, threshold_sweep
from ..features.network import graph_summary
from ..features.pipeline import build_features
from ..generators.scenarios import generate_attack_scenario
from ..generators.catalog import catalog_summary as generator_summary
from ..identify.catalog import load_attacks
from ..identify.discovery import discover_hypotheses
from ..schemas import DetectionRequest, PredictionRequest, SimulationConfig
from ..storage.db import (
    get_experiment,
    get_latest_metrics,
    get_rounds,
    get_simulation,
    init_db,
    save_metrics,
    save_round,
    save_simulation,
)

router = APIRouter(prefix="/api", tags=["mastershield"])
MODEL_PATH = Path("ml/models/detector.joblib")


def ids_for(config: SimulationConfig) -> list[str]:
    return config.attack_ids or [a.id for a in load_attacks()]


def build_dataset(config: SimulationConfig):
    return generate_attack_scenario(
        config.events,
        config.seed,
        ids_for(config),
        config.fraud_rate,
        config.difficulty,
        config.adaptation,
        config.noise,
    )


def split_fit(config: SimulationConfig):
    df = build_dataset(config)
    X = build_features(df)
    train_idx, test_idx = train_test_split(
        range(len(df)),
        test_size=.25,
        random_state=config.seed,
        stratify=df["ground_truth"],
    )
    model = Detector().fit(X.iloc[train_idx], df.ground_truth.iloc[train_idx])
    return df, X, X.iloc[test_idx], df.ground_truth.iloc[test_idx], model


def annotate_attack_groups(df: pd.DataFrame, attacks):
    by_id = {a.id: a for a in attacks}
    out = df.copy()
    out["attack_family"] = out["attack_id"].map(
        lambda value: by_id[value].family if value in by_id else "benign"
    )
    out["attack_difficulty"] = out["attack_id"].map(
        lambda value: by_id[value].difficulty if value in by_id else "none"
    )
    return out


def safe_value(value):
    """Convert NumPy/pandas scalar values into strict JSON-compatible values."""
    if value is None:
        return None
    if isinstance(value, float):
        return float(value) if math.isfinite(value) else None
    try:
        missing = pd.isna(value)
        if isinstance(missing, bool) and missing:
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(value, "item"):
        try:
            return safe_value(value.item())
        except (TypeError, ValueError):
            pass
    return value


def safe_records(frame: pd.DataFrame) -> list[dict]:
    return [
        {str(key): safe_value(value) for key, value in row.items()}
        for row in frame.to_dict(orient="records")
    ]


def normalize_prediction_frame(frame: pd.DataFrame) -> pd.DataFrame:
    """Fill optional identity fields required by causal network features for point predictions."""
    out = frame.copy()
    defaults = {
        "account_id": 1,
        "beneficiary_id": 1,
        "device_id": 1,
        "merchant_id": 1,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    for column, default in defaults.items():
        if column not in out.columns:
            out[column] = [default + i if isinstance(default, int) else default for i in range(len(out))]
    return out


@router.get("/catalog/summary")
def catalog_summary():
    items = load_attacks()
    family_counts: dict[str, int] = {}
    rail_counts: dict[str, int] = {}
    for attack in items:
        family_counts[attack.family] = family_counts.get(attack.family, 0) + 1
        for rail in attack.payment_rails:
            rail_counts[rail] = rail_counts.get(rail, 0) + 1
    return {
        "attack_count": len(items),
        "family_count": len(family_counts),
        "families": family_counts,
        "payment_rail_coverage": rail_counts,
        "critical_count": sum(a.severity == "critical" for a in items),
        "very_high_difficulty_count": sum(a.difficulty == "very-high" for a in items),
        "average_novelty": round(sum(a.novelty_score for a in items) / max(len(items), 1), 4),
        "generators": generator_summary(),
    }


@router.get("/catalog/discover")
def catalog_discover(limit: int = 20):
    limit = max(1, min(limit, 50))
    findings = discover_hypotheses(load_attacks(), limit)
    return {
        "count": len(findings),
        "hypotheses": [finding.__dict__ for finding in findings],
        "safe_simulation_only": True,
    }


@router.get("/attacks")
def list_attacks():
    items = load_attacks()
    return {
        "count": len(items),
        "families": sorted({a.family for a in items}),
        "attacks": [a.model_dump() for a in items],
    }


@router.get("/attacks/{attack_id}")
def get_attack(attack_id: str):
    item = next((a for a in load_attacks() if a.id.lower() == attack_id.lower()), None)
    if item is None:
        raise HTTPException(status_code=404, detail="attack not found")
    return item.model_dump()


@router.post("/simulate")
def simulate(config: SimulationConfig):
    df = build_dataset(config)
    simulation_id = f"SIM-{config.seed}-{config.events}"
    init_db()
    save_simulation({
        "simulation_id": simulation_id,
        "seed": config.seed,
        "event_count": len(df),
        "attack_count": len(ids_for(config)),
        "fraud_rate": config.fraud_rate,
        "difficulty": config.difficulty,
        "adaptation": config.adaptation,
        "noise": config.noise,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {
        "simulation_id": simulation_id,
        "seed": config.seed,
        "events_generated": len(df),
        "fraud_events": int(df.ground_truth.sum()),
        "attack_count": len(ids_for(config)),
        "graph": graph_summary(df),
        "sample": safe_records(df.head(100)),
    }


@router.get("/simulations/{simulation_id}")
def simulation(simulation_id: str):
    init_db()
    item = get_simulation(simulation_id)
    if item is None:
        raise HTTPException(status_code=404, detail="simulation not found")
    return item


@router.get("/simulations/{simulation_id}/events")
def simulation_events(simulation_id: str, limit: int = 100, offset: int = 0):
    init_db()
    item = get_simulation(simulation_id)
    if item is None:
        raise HTTPException(status_code=404, detail="simulation not found")
    limit = max(1, min(limit, 1000))
    offset = max(0, offset)
    cfg = SimulationConfig(
        events=item["event_count"],
        seed=item["seed"],
        fraud_rate=item["fraud_rate"],
        difficulty=item["difficulty"],
        adaptation=item.get("adaptation", "static"),
        noise=item.get("noise", "medium"),
    )
    df = build_dataset(cfg)
    page = df.iloc[offset: offset + limit]
    return {
        "simulation_id": simulation_id,
        "offset": offset,
        "limit": limit,
        "total": len(df),
        "events": safe_records(page),
    }


@router.get("/simulations/{simulation_id}/results")
def simulation_results(simulation_id: str):
    init_db()
    item = get_simulation(simulation_id)
    if item is None:
        raise HTTPException(status_code=404, detail="simulation not found")
    return {
        "simulation": item,
        "latest_experiment": get_latest_metrics(simulation_id),
        "rounds": get_rounds(simulation_id),
    }


@router.post("/detect")
def detect(config: DetectionRequest):
    df, _, xte, yte, model = split_fit(config)
    start = time.perf_counter()
    scores = model.predict_scores(xte)
    elapsed_ms = (time.perf_counter() - start) * 1000
    metrics = model.evaluate(xte, yte, config.threshold)
    experiment_id = f"EXP-{config.seed}-{config.events}-{int(config.threshold * 100)}"
    init_db()
    saved_metrics = {
        **metrics,
        "inference_ms": elapsed_ms,
        "inference_ms_per_event": elapsed_ms / max(len(xte), 1),
    }
    save_metrics({
        "experiment_id": experiment_id,
        "simulation_id": f"SIM-{config.seed}-{config.events}",
        "model_version": Detector.VERSION,
        "threshold": config.threshold,
        "metrics": saved_metrics,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    test_frame = annotate_attack_groups(df.iloc[xte.index].reset_index(drop=True), load_attacks())
    return {
        "experiment_id": experiment_id,
        "model_version": Detector.VERSION,
        "metrics": saved_metrics,
        "thresholds": threshold_sweep(yte, scores),
        "by_attack": metrics_by_group(test_frame, scores, "attack_id", config.threshold),
        "by_family": metrics_by_group(test_frame, scores, "attack_family", config.threshold),
        "by_difficulty": metrics_by_group(test_frame, scores, "attack_difficulty", config.threshold),
        "by_rail": metrics_by_group(test_frame, scores, "rail", config.threshold),
        "events": len(df),
        "test_events": len(xte),
        "sample_predictions": [
            {
                "transaction_id": str(test_frame.iloc[i]["transaction_id"]),
                "risk_score": float(scores[i]),
                "ground_truth": int(yte.iloc[i]),
                "attack_id": test_frame.iloc[i].get("attack_id"),
                "attack_family": test_frame.iloc[i].get("attack_family"),
            }
            for i in range(min(50, len(test_frame)))
        ],
    }


@router.post("/predict")
def predict(request: PredictionRequest):
    frame = pd.DataFrame(request.events)
    if frame.empty:
        raise HTTPException(status_code=422, detail="events must not be empty")
    if "transaction_id" not in frame.columns:
        frame["transaction_id"] = [f"ROW_{index:06d}" for index in range(len(frame))]
    frame = normalize_prediction_frame(frame)
    results = assess_frame(frame, request.threshold, request.seed)
    return {
        "model_version": get_model(seed=request.seed).VERSION,
        "threshold": request.threshold,
        "count": len(results),
        "results": results,
    }


@router.get("/experiments/{experiment_id}")
def experiment(experiment_id: str):
    init_db()
    item = get_experiment(experiment_id)
    if item is None:
        raise HTTPException(status_code=404, detail="experiment not found")
    return item


@router.get("/simulations/{simulation_id}/rounds")
def simulation_rounds(simulation_id: str):
    init_db()
    return {"simulation_id": simulation_id, "rounds": get_rounds(simulation_id)}


@router.get("/models/current")
def current_model():
    if not MODEL_PATH.exists():
        return {"available": False, "version": Detector.VERSION}
    model = Detector.load(MODEL_PATH)
    return {
        "available": True,
        "version": model.VERSION,
        "features": model.feature_names,
        "feature_importance": model.feature_importance_,
    }


@router.get("/transactions/{transaction_id}")
def synthetic_transaction(transaction_id: str, seed: int = 829134, events: int = 10000):
    df = generate_attack_scenario(events, seed, [a.id for a in load_attacks()], .12, "high")
    row = df[df.transaction_id.eq(transaction_id)]
    if row.empty:
        raise HTTPException(status_code=404, detail="synthetic transaction not found")
    return {"synthetic": True, **safe_records(row)[0]}


@router.get("/transactions/{transaction_id}/assessment")
def transaction_assessment(transaction_id: str, seed: int = 829134, events: int = 10000, threshold: float = .5):
    df = generate_attack_scenario(events, seed, [a.id for a in load_attacks()], .12, "high")
    row = df[df.transaction_id.eq(transaction_id)]
    if row.empty:
        raise HTTPException(status_code=404, detail="synthetic transaction not found")

    model = get_model(seed=seed)
    feature_row = build_features(row)
    score = float(model.predict_scores(feature_row)[0])
    explanation = model.explain(feature_row.iloc[0], score, threshold)
    explanation["observable_signals"] = explain_row(row.iloc[0], score)
    explanation["attack_id"] = row.iloc[0].get("attack_id")
    explanation["synthetic"] = True
    return {**safe_records(row)[0], **explanation}


@router.post("/adversarial/search")
def adversarial_search(config: SimulationConfig):
    df, _, _, _, model = split_fit(config)
    findings = find_hard_variants(df, model, config.seed + 7, rounds=3)
    return {
        "simulation_id": f"SIM-{config.seed}-{config.events}",
        "findings": findings,
        "count": len(findings),
    }


@router.post("/adversarial/harden")
def adversarial_harden(config: SimulationConfig):
    df = build_dataset(config)
    simulation_id = f"SIM-{config.seed}-{config.events}"
    init_db()
    save_simulation({
        "simulation_id": simulation_id,
        "seed": config.seed,
        "event_count": len(df),
        "attack_count": len(ids_for(config)),
        "fraud_rate": config.fraud_rate,
        "difficulty": config.difficulty,
        "adaptation": config.adaptation,
        "noise": config.noise,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    result = harden_detector(df, config.seed, rounds=3)
    result["final_detector"].save(MODEL_PATH)
    now = datetime.now(timezone.utc).isoformat()
    for item in result["rounds"]:
        save_round({
            "round_id": f"{simulation_id}-R{item['round']}",
            "simulation_id": simulation_id,
            "round_number": item["round"],
            "attack_ids": ids_for(config),
            "metrics": item,
            "created_at": now,
        })
    return {
        "simulation_id": simulation_id,
        "baseline": result["baseline"],
        "rounds": result["rounds"],
        "model_version": Detector.VERSION,
        "train_events": result["train_events"],
        "red_team_events": result["red_team_events"],
        "untouched_test_events": result["untouched_test_events"],
    }
