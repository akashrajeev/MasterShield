from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from sklearn.model_selection import train_test_split
from ..schemas import SimulationConfig
from ..identify.catalog import load_attacks
from ..generators.scenarios import generate_attack_scenario
from ..features.pipeline import build_features
from ..detection.model import Detector
from ..adversarial.search_v2 import find_hard_variants

router=APIRouter(prefix="/api")

def _ids(config):
    return config.attack_ids or [a.id for a in load_attacks()]

def _dataset(config):
    ids=_ids(config)
    return generate_attack_scenario(config.events,config.seed,ids,config.fraud_rate,config.difficulty)

@router.get("/attacks")
def attacks():
    items=load_attacks()
    return {"count":len(items),"families":sorted({a.family for a in items}),"attacks":[a.model_dump() for a in items]}

@router.get("/attacks/{attack_id}")
def attack(attack_id:str):
    item=next((a for a in load_attacks() if a.id.lower()==attack_id.lower()),None)
    if not item: raise HTTPException(404,"attack not found")
    return item.model_dump()

@router.post("/simulate")
def simulate(config:SimulationConfig):
    df=_dataset(config)
    return {"simulation_id":f"SIM-{config.seed}-{config.events}","seed":config.seed,"events_generated":len(df),"fraud_events":int(df.ground_truth.sum()),"attack_count":len(_ids(config)),"sample":df.head(50).to_dict(orient="records")}

@router.post("/detect")
def detect(config:SimulationConfig):
    df=_dataset(config); X=build_features(df)
    Xtr,Xte,ytr,yte=train_test_split(X,df.ground_truth,test_size=.25,random_state=config.seed,stratify=df.ground_truth)
    detector=Detector().fit(Xtr,ytr); metrics=detector.evaluate(Xte,yte); scores=detector.predict_scores(Xte)
    return {"metrics":metrics,"events":len(df),"test_events":len(Xte),"mean_risk":float(scores.mean()),"created_at":datetime.now(timezone.utc).isoformat()}

@router.post("/closed-loop")
def closed_loop(config:SimulationConfig):
    df=_dataset(config); X=build_features(df)
    Xtr,Xte,ytr,yte=train_test_split(X,df.ground_truth,test_size=.25,random_state=config.seed,stratify=df.ground_truth)
    detector=Detector().fit(Xtr,ytr); baseline=detector.evaluate(Xte,yte)
    hard=find_hard_variants(df,detector,config.seed+7,rounds=3)
    return {"simulation_id":f"SIM-{config.seed}-{config.events}","baseline":baseline,"hard_variants":hard,"variant_count":len(hard),"generated_events":len(df),"created_at":datetime.now(timezone.utc).isoformat()}
