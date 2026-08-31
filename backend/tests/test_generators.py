import pandas as pd
from backend.app.generators.scenarios import generate_attack_scenario

def test_generation_is_reproducible():
    a=generate_attack_scenario(500,123,["T-01"],.15,"high")
    b=generate_attack_scenario(500,123,["T-01"],.15,"high")
    pd.testing.assert_frame_equal(a,b)

def test_generation_contains_ground_truth():
    df=generate_attack_scenario(500,123,["I-01","L-01"],.15,"very-high")
    assert len(df)==500
    assert set(df["ground_truth"].unique()).issubset({0,1})
    assert df["attack_id"].notna().sum() > 0
