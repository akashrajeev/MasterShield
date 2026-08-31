from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from sklearn.model_selection import train_test_split

from ..adversarial.hardening import harden_detector
from ..adversarial.search_v2 import find_hard_variants
from ..detection.model import Detector
from ..evaluation.metrics import binary_metrics, metrics_by_group, threshold_sweep
from ..features.pipeline import build_features
from ..features.network import graph_summary
from ..generators.scenarios import generate_attack_scenario
from ..identify.catalog import load_attacks
from ..schemas import DetectionRequest, SimulationConfig
from ..storage.db import init_db, save_metrics, save_round, save_simulation

router = APIRouter(prefix="/api", tags=["mastershield"])
MODEL_PATH = Path("ml/models/detector.joblib")


def ids_for(config: SimulationConfig) -> list[str]:
    return config.attack_ids or [a.id for a in load_attacks()]


def build_dataset(config: SimulationConfig):
    return generate_attack_scenario(config.events, config.seed, ids_for(config), config.fraud_rate, config.difficulty)


def split_fit(config: SimulationConfig):
    df = build_dataset(config)
    X = build_features(df)
    xtr, xte, ytr, yte = train_test_split(X, df["ground_truth"], test_size=.25, random_state=config.seed, stratify=df["ground_truth"])
    model = Detector().fit(xtr, ytr)
    return df, X, xte, yte, model


@router.get("/attacks")
def list_attacks():
    items = load_attacks()
    return {"count": len(items), "families": sorted({a.family for a in items}), "attacks": [a.model_dump() for a in items]}


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
        "simulation_id": simulation_id, "seed": config.seed,
        "event_count": len(df), "attack_count": len(ids_for(config)),
        "fraud_rate": config.fraud_rate, "difficulty": config.difficulty,
        "adaptation": config.adaptation, "noise": config.noise,
        "status": "completed", "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {
        "simulation_id": simulation_id, "seed": config.seed,
        "events_generated": len(df), "fraud_events": int(df.ground_truth.sum()),
        "attack_count": len(ids_for(config)), "graph": graph_summary(df),
        "sample": df.head(100).where(df.head(100).notna(), None).to_dict(orient="records"),
    }


@router.post("/detect")
def detect(config: DetectionRequest):
    df, X, xte, yte, model = split_fit(config)
    scores = model.predict_scores(xte)
    metrics = model.evaluate(xte, yte, config.threshold)
    experiment_id = f"EXP-{config.seed}-{config.events}-{int(config.threshold * 100)}"
    init_db()
    save_metrics({
        "experiment_id": experiment_id,
        "simulation_id": f"SIM-{config.seed}-{config.events}",
        "model_version": Detector.VERSION,
        "threshold": config.threshold,
        "metrics": metrics,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {
        "experiment_id": experiment_id,
        "metrics": metrics,
        "thresholds": threshold_sweep(yte, scores),
        "by_attack": metrics_by_group(df.iloc[xte.index].reset_index(drop=True), scores, "attack_id", config.threshold) if "attack_id" in df else {},
        "by_rail": metrics_by_group(df.iloc[xte.index].reset_index(drop=True), scores, "rail", config.threshold),
        "events": len(df), "test_events": len(xte),
    }


@router.get("/models/current")
def current_model():
    if not MODEL_PATH.exists():
        return {"available": False, "version": Detector.VERSION}
    model = Detector.load(MODEL_PATH)
    return {"available": True, "version": model.VERSION, "features": model.feature_names, "feature_importance": model.feature_importance_}


@router.get("/transactions/{transaction_id}")
def synthetic_transaction(transaction_id: str, seed: int = 829134, events: int = 10000):
    df = generate_attack_scenario(events, seed, [a.id for a in load_attacks()], .12, "high")
    row = df[df.transaction_id.eq(transaction_id)]
    if row.empty:
        raise HTTPException(status_code=404, detail="synthetic transaction not found")
    return row.iloc[0].where(row.iloc[0].notna(), None).to_dict()


@router.post("/adversarial/search")
def adversarial_search(config: SimulationConfig):
    df, _, _, _, model = split_fit(config)
    findings = find_hard_variants(df, model, config.seed + 7, rounds=3)
    return {"simulation_id": f"SIM-{config.seed}-{config.events}", "findings": findings, "count": len(findings)}


@router.post("/adversarial/harden")
def adversarial_harden(config: SimulationConfig):
    df = build_dataset(config)
    train, holdout = train_test_split(df, test_size=.25, random_state=config.seed, stratify=df["ground_truth"])
    result = harden_detector(train.reset_index(drop=True), holdout.reset_index(drop=True), config.seed, rounds=3)
    result["final_detector"].save(MODEL_PATH)
    safe = {"baseline": result["baseline"], "rounds": result["rounds"], "model_version": Detector.VERSION}
    return safe
