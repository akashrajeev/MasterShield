from fastapi import APIRouter, HTTPException
from sklearn.model_selection import train_test_split
from ..schemas import SimulationConfig
from ..identify.catalog import load_attacks
from ..generators.scenarios import generate_attack_scenario
from ..features.pipeline import build_features
from ..detection.model import Detector

router = APIRouter(prefix="/api")

@router.get("/attacks")
def attacks():
    items = load_attacks()
    return {"count": len(items), "families": sorted({a.family for a in items}), "attacks": [a.model_dump() for a in items]}

@router.get("/attacks/{attack_id}")
def attack(attack_id: str):
    item = next((a for a in load_attacks() if a.id == attack_id), None)
    if not item:
        raise HTTPException(404, "attack not found")
    return item.model_dump()

@router.post("/simulate")
def simulate(config: SimulationConfig):
    attack_ids = config.attack_ids or [a.id for a in load_attacks()]
    df = generate_attack_scenario(config.events, config.seed, attack_ids, config.fraud_rate, config.difficulty)
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
    df = generate_attack_scenario(config.events, config.seed, config.attack_ids or [a.id for a in load_attacks()], config.fraud_rate, config.difficulty)
    X = build_features(df)
    X_train, X_test, y_train, y_test = train_test_split(X, df.ground_truth, test_size=.25, random_state=config.seed, stratify=df.ground_truth)
    detector = Detector().fit(X_train, y_train)
    metrics = detector.evaluate(X_test, y_test)
    scores = detector.predict_scores(X_test)
    return {"metrics": metrics, "events": len(df), "test_events": len(X_test), "mean_risk": float(scores.mean())}
