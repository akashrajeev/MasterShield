from fastapi import APIRouter, HTTPException
from ..generators.scenarios import generate_attack_scenario
from ..identify.catalog import load_attacks

router=APIRouter(prefix="/api/transactions",tags=["transactions"])

@router.get("/sample")
def sample(events:int=100,seed:int=829134):
    ids=[a.id for a in load_attacks()]
    df=generate_attack_scenario(events,seed,ids,.12,"high")
    return {"events":len(df),"transactions":df.head(events).to_dict(orient="records")}
