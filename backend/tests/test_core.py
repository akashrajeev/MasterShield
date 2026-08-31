from backend.app.identify.catalog import load_attacks
from backend.app.generators.transaction import generate_transactions
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector


def test_catalog_has_120_attacks():
    attacks = load_attacks()
    assert len(attacks) >= 120
    assert len({a.id for a in attacks}) == len(attacks)
    assert all(a.generator_id for a in attacks)


def test_generation_is_seed_reproducible():
    a = generate_transactions(100, 1234)
    b = generate_transactions(100, 1234)
    assert a.equals(b)


def test_detector_pipeline():
    df = generate_transactions(1000, 1234)
    X = build_features(df)
    detector = Detector().fit(X, df.ground_truth)
    metrics = detector.evaluate(X, df.ground_truth)
    assert 0 <= metrics["precision"] <= 1
    assert 0 <= metrics["recall"] <= 1
    assert 0 <= metrics["f1"] <= 1
    assert 0 <= metrics["roc_auc"] <= 1
