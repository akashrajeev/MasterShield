from __future__ import annotations

from backend.app.generators.catalog import catalog_summary, generator_for_attack
from backend.app.identify.catalog import load_attacks
from backend.app.identify.discovery import discover_hypotheses
from backend.app.features.graph import graph_summary
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector


def test_every_attack_maps_to_a_generator():
    attacks = load_attacks()
    assert len(attacks) >= 120
    assert len({attack.id for attack in attacks}) == len(attacks)
    assert all(generator_for_attack(attack.id) != "unknown" for attack in attacks)
    assert len(catalog_summary()["generators"]) >= 8


def test_discovery_is_safe_and_deterministic():
    attacks = load_attacks()
    first = discover_hypotheses(attacks, 12)
    second = discover_hypotheses(attacks, 12)
    assert [item.hypothesis_id for item in first] == [item.hypothesis_id for item in second]
    assert 1 <= len(first) <= 12
    assert all(0 <= item.novelty_score <= 1 for item in first)
    assert all(len(item.stages) == 2 for item in first)


def test_graph_and_detector_pipeline_are_complete():
    ids = [attack.id for attack in load_attacks()[:24]]
    df = generate_attack_scenario(1200, 778899, ids, .14, "very-high", "adversarial", "medium")
    summary = graph_summary(df)
    assert summary["nodes"] > 0
    assert summary["edges"] > 0
    X = build_features(df)
    assert X.shape[1] >= 30
    assert X.isna().sum().sum() == 0
    model = Detector().fit(X.iloc[:900], df.ground_truth.iloc[:900])
    metrics = model.evaluate(X.iloc[900:], df.ground_truth.iloc[900:])
    for key in ["precision", "recall", "f1", "roc_auc", "pr_auc", "false_positive_rate", "false_negative_rate"]:
        assert 0 <= metrics[key] <= 1
