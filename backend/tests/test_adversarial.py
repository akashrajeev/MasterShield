from backend.app.adversarial.hardening import harden_detector
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks


def test_hardening_reports_isolated_test_split():
    ids = [a.id for a in load_attacks()[:30]]
    df = generate_attack_scenario(1200, 333333, ids, .15, "very-high")
    result = harden_detector(df, 333333, rounds=1)
    assert result["train_events"] > 0
    assert result["red_team_events"] > 0
    assert result["untouched_test_events"] > 0
    assert len(result["rounds"]) == 2
    assert 0.2 <= result["rounds"][0]["operating_threshold"] <= 0.9
    assert 0.2 <= result["rounds"][1]["operating_threshold"] <= 0.9
    for round_result in result["rounds"]:
        metrics = round_result["metrics"]
        assert all(value == value for value in metrics.values() if isinstance(value, float))
