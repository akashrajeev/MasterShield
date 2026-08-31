from __future__ import annotations

import json
from pathlib import Path

from backend.app.adversarial.hardening import harden_detector
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks


def main() -> None:
    seed = 829134
    attacks = load_attacks()
    df = generate_attack_scenario(20000, seed, [a.id for a in attacks], .12, "very-high")
    result = harden_detector(df, seed, rounds=3)
    summary = {
        "seed": seed,
        "attack_count": len(attacks),
        "events": len(df),
        "baseline": result["baseline"],
        "rounds": result["rounds"],
        "train_events_final": result["train_events"],
        "red_team_events": result["red_team_events"],
        "untouched_test_events": result["untouched_test_events"],
    }
    Path("ml/results").mkdir(parents=True, exist_ok=True)
    Path("ml/results/closed_loop.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
