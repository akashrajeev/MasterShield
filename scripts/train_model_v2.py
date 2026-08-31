from __future__ import annotations
import json
from pathlib import Path
import joblib
from sklearn.model_selection import train_test_split
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector

MODEL_DIR=Path("ml/models")
RESULT_DIR=Path("ml/results")

if __name__ == "__main__":
    ids=[a.id for a in load_attacks()]
    df=generate_attack_scenario(50000,829134,ids,.12,"high")
    X=build_features(df)
    Xtr,Xte,ytr,yte=train_test_split(X,df.ground_truth,test_size=.2,random_state=829134,stratify=df.ground_truth)
    detector=Detector().fit(Xtr,ytr)
    metrics=detector.evaluate(Xte,yte)
    MODEL_DIR.mkdir(parents=True,exist_ok=True); RESULT_DIR.mkdir(parents=True,exist_ok=True)
    joblib.dump(detector,MODEL_DIR/"detector.joblib")
    (MODEL_DIR/"feature_schema.json").write_text(json.dumps(list(X.columns),indent=2),encoding="utf-8")
    (RESULT_DIR/"baseline_metrics.json").write_text(json.dumps(metrics,indent=2),encoding="utf-8")
    print(json.dumps(metrics,indent=2))
