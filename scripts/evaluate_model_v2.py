from __future__ import annotations
import json
from pathlib import Path
from sklearn.model_selection import train_test_split
from backend.app.identify.catalog import load_attacks
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.features.pipeline_v2 import build_features
from backend.app.detection.model import Detector
from backend.app.evaluation.metrics_v2 import binary_metrics

SEED=829134

def main():
    attacks=load_attacks(); ids=[a.id for a in attacks]
    df=generate_attack_scenario(40000,SEED,ids,.12,"high")
    X=build_features(df)
    tr,te=train_test_split(range(len(df)),test_size=.25,random_state=SEED,stratify=df.ground_truth)
    model=Detector().fit(X.iloc[tr],df.ground_truth.iloc[tr])
    scores=model.predict_scores(X.iloc[te])
    result=binary_metrics(df.ground_truth.iloc[te],scores,.5)
    result["events"]=len(df); result["test_events"]=len(te); result["attack_count"]=len(ids)
    Path("ml/results").mkdir(parents=True,exist_ok=True)
    Path("ml/results/evaluation_v2.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result,indent=2))

if __name__=="__main__": main()
