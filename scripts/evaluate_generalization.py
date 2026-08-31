from __future__ import annotations
import json
from pathlib import Path
from sklearn.model_selection import train_test_split
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector


def run(train_ids, test_ids, seed=11029, events=20000):
    train_df=generate_attack_scenario(events,seed,train_ids,.12,"high")
    test_df=generate_attack_scenario(events//2,seed+1,test_ids,.12,"very-high")
    model=Detector().fit(build_features(train_df),train_df.ground_truth)
    return model.evaluate(build_features(test_df),test_df.ground_truth)

if __name__=="__main__":
    attacks=load_attacks(); by_family={}
    for a in attacks: by_family.setdefault(a.family,[]).append(a.id)
    families=list(by_family)
    held_out=set(families[-2:])
    train_ids=[a.id for a in attacks if a.family not in held_out]
    test_ids=[a.id for a in attacks if a.family in held_out]
    result={"held_out_families":sorted(held_out),"metrics":run(train_ids,test_ids)}
    Path("ml/results").mkdir(parents=True,exist_ok=True)
    Path("ml/results/generalization.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result,indent=2))
