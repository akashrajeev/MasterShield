from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.features.pipeline_v2 import build_features

def test_feature_matrix_has_no_missing_values():
    df=generate_attack_scenario(600,900,["I-01","L-01","T-01"],.15,"very-high")
    X=build_features(df)
    assert len(X)==len(df)
    assert X.isna().sum().sum()==0
    assert X.shape[1] >= 20
