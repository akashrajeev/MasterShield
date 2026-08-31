from backend.app.identify.catalog import load_attacks
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector


def test_catalog_has_broad_attack_coverage():
    attacks = load_attacks()
    assert len(attacks) >= 120
    assert len({a.family for a in attacks}) >= 10
    assert all(a.generator_id for a in attacks)


def test_generation_is_reproducible_and_labeled():
    ids = [a.id for a in load_attacks()]
    a = generate_attack_scenario(300, 12345, ids, .15, "high")
    b = generate_attack_scenario(300, 12345, ids, .15, "high")
    assert a.equals(b)
    assert {"ground_truth", "attack_id", "account_id", "beneficiary_id", "device_id"}.issubset(a.columns)
    assert a.ground_truth.sum() > 0


def test_detector_produces_bounded_metrics():
    ids = [a.id for a in load_attacks()[:20]]
    df = generate_attack_scenario(1000, 54321, ids, .15, "high")
    X = build_features(df)
    model = Detector().fit(X.iloc[:750], df.ground_truth.iloc[:750])
    metrics = model.evaluate(X.iloc[750:], df.ground_truth.iloc[750:])
    for key in ["precision", "recall", "f1", "roc_auc", "false_positive_rate", "false_negative_rate"]:
        assert 0.0 <= metrics[key] <= 1.0
