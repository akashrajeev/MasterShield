from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.features.pipeline import build_features, FEATURE_NAMES


def test_feature_matrix_has_no_missing_values_and_no_label_leakage():
    df = generate_attack_scenario(600, 900, ["ID-01", "SE-01", "TE-01"], .15, "very-high")
    X = build_features(df)
    assert len(X) == len(df)
    assert X.isna().sum().sum() == 0
    assert X.shape[1] >= 20
    forbidden = {"ground_truth", "attack_id", "attack_family", "scenario_id", "scenario_stage", "multi_stage_scenario"}
    assert forbidden.isdisjoint(X.columns)
    assert list(X.columns) == FEATURE_NAMES
