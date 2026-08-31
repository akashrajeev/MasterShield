from sklearn.model_selection import train_test_split
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector

def test_detector_produces_valid_metrics():
    df=generate_attack_scenario(1200,456,["S-01","T-01","L-01"],.15,"high")
    X=build_features(df)
    xtr,xte,ytr,yte=train_test_split(X,df.ground_truth,test_size=.25,random_state=456,stratify=df.ground_truth)
    detector=Detector().fit(xtr,ytr)
    m=detector.evaluate(xte,yte)
    for key in ("precision","recall","f1","roc_auc","false_positive_rate","false_negative_rate"):
        assert 0 <= m[key] <= 1
