from fastapi import APIRouter, HTTPException
from ..schemas import SimulationConfig
from ..identify.catalog import load_attacks
from ..generators.transaction import generate_transactions
from ..features.pipeline import build_features
from ..detection.model import Detector

router = APIRouter(prefix="/api")

@router.get("/attacks")
def attacks():
    items = load_attacks()
    return {"count": len(items), "attacks": [a.model_dump() for a in items]}

@router.get("/attacks/{attack_id}")
def attack(attack_id: str):
    item = next((a for a in load_attacks() if a.id == attack_id), None)
    if not item:
        raise HTTPException(404, "attack not found")
    return item.model_dump()

@router.post("/simulate")
def simulate(config: SimulationConfig):
    attack_ids = config.attack_ids or [a.id for a in load_attacks()]
    df = generate_transactions(config.events, config.seed, config.fraud_rate, attack_ids)
    return {
        "simulation_id": f"SIM-{config.seed}-{config.events}",
        "seed": config.seed,
        "events_generated": len(df),
        "fraud_events": int(df.ground_truth.sum()),
        "attack_count": len(attack_ids),
        "sample": df.head(25).where(df.head(25).notna(), None).to_dict(orient="records"),
    }

@router.post("/detect")
def detect(config: SimulationConfig):
    df = generate_transactions(config.events, config.seed, config.fraud_rate, config.attack_ids)
    X = build_features(df)
    detector = Detector().fit(X, df.ground_truth)
    metrics = detector.evaluate(X, df.ground_truth)
    scores = detector.predict_scores(X)
    return {"metrics": metrics, "events": len(df), "mean_risk": float(scores.mean())}
