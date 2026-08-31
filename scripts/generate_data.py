from __future__ import annotations

import argparse
from pathlib import Path

from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate reproducible synthetic MasterShield telemetry")
    parser.add_argument("--events", type=int, default=10_000)
    parser.add_argument("--seed", type=int, default=829134)
    parser.add_argument("--fraud-rate", type=float, default=.12)
    parser.add_argument("--difficulty", choices=["low", "medium", "high", "very-high"], default="high")
    parser.add_argument("--adaptation", choices=["static", "adaptive", "adversarial"], default="static")
    parser.add_argument("--noise", choices=["low", "medium", "high"], default="medium")
    parser.add_argument("--out", default="data/sample/transactions.csv")
    args = parser.parse_args()

    attack_ids = [attack.id for attack in load_attacks()]
    df = generate_attack_scenario(
        args.events,
        args.seed,
        attack_ids,
        args.fraud_rate,
        args.difficulty,
        args.adaptation,
        args.noise,
    )
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output, index=False)

    print(f"generated {len(df):,} synthetic events -> {output}")
    print(f"fraud events: {int(df.ground_truth.sum()):,}")
    print(f"attack families represented: {df.attack_id.nunique(dropna=True):,} attack IDs")


if __name__ == "__main__":
    main()
