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
from ..detection.explain import explain_row

router=APIRouter(prefix="/api", tags=["mastershield"])

def ids_for(config):
    return config.attack_ids or [a.id for a in load_attacks()]

def build_dataset(config):
    ids=ids_for(config)
    return generate_attack_scenario(config.events,config.seed,ids,config.fraud_rate,config.difficulty)

@router.get("/attacks")
def list_attacks():
    items=load_attacks()
    return {"count":len(items),"families":sorted({a.family for a in items}),"attacks":[a.model_dump() for a in items]}

@router.get("/attacks/{attack_id}")
def get_attack(attack_id:str):
    item=next((a for a in load_attacks() if a.id.lower()==attack_id.lower()),None)
    if item is None: raise HTTPException(status_code=404,detail="attack not found")
    return item.model_dump()

@router.post("/simulate")
def simulate(config:SimulationConfig):
    df=build_dataset(config)
    return {"simulation_id":f"SIM-{config.seed}-{config.events}","seed":config.seed,"events_generated":len(df),"fraud_events":int(df.ground_truth.sum()),"attack_count":len(ids_for(config)),"sample":df.head(100).to_dict(orient="records")}

@router.post("/detect")
def detect(config:SimulationConfig):
    df=build_dataset(config); X=build_features(df)
    xtr,xte,ytr,yte=train_test_split(X,df.ground_truth,test_size=.25,random_state=config.seed,stratify=df.ground_truth)
    model=Detector().fit(xtr,ytr); scores=model.predict_scores(xte); metrics=model.evaluate(xte,yte)
    return {"metrics":metrics,"events":len(df),"test_events":len(xte),"sample_predictions":[{"risk_score":float(scores[i]),"ground_truth":int(yte.iloc[i])} for i in range(min(50,len(xte)))]}

@router.post("/closed-loop")
def closed_loop(config:SimulationConfig):
    df=build_dataset(config); X=build_features(df)
    xtr,xte,ytr,yte=train_test_split(X,df.ground_truth,test_size=.25,random_state=config.seed,stratify=df.ground_truth)
    model=Detector().fit(xtr,ytr); baseline=model.evaluate(xte,yte)
    variants=find_hard_variants(df,model,config.seed+7,rounds=3)
    return {"simulation_id":f"SIM-{config.seed}-{config.events}","baseline":baseline,"hard_variants":variants,"variant_count":len(variants),"generated_events":len(df),"created_at":datetime.now(timezone.utc).isoformat()}
