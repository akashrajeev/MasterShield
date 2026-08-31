from __future__ import annotations

import json
from pathlib import Path

from backend.app.adversarial.hardening import harden_detector
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks

SEED = 829134
EVENTS = 20_000


def main() -> None:
    attacks = load_attacks()
    attack_ids = [attack.id for attack in attacks]
    df = generate_attack_scenario(
        EVENTS, SEED, attack_ids, .12, "very-high", "adversarial", "medium"
    )
    result = harden_detector(df, SEED, rounds=3)
    baseline_f1 = float(result["baseline"]["f1"])
    final_f1 = float(result["rounds"][-1]["metrics"]["f1"])
    summary = {
        "seed": SEED,
        "attack_count": len(attacks),
        "events": len(df),
        "baseline": result["baseline"],
        "rounds": result["rounds"],
        "final": result["rounds"][-1]["metrics"],
        "f1_change": final_f1 - baseline_f1,
        "train_events_final": result["train_events"],
        "red_team_events": result["red_team_events"],
        "untouched_test_events": result["untouched_test_events"],
        "protocol": {
            "train_fraction": .60,
            "red_team_fraction": .20,
            "untouched_test_fraction": .20,
            "rounds": 3,
        },
    }
    Path("ml/results").mkdir(parents=True, exist_ok=True)
    Path("ml/results/closed_loop.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
