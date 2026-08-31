from __future__ import annotations

import argparse
from pathlib import Path

from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic MasterShield payment telemetry")
    parser.add_argument("--events", type=int, default=10000)
    parser.add_argument("--seed", type=int, default=829134)
    parser.add_argument("--fraud-rate", type=float, default=.12)
    parser.add_argument("--difficulty", choices=["low", "medium", "high", "very-high"], default="high")
    parser.add_argument("--out", default="data/sample/transactions.csv")
    args = parser.parse_args()

    attack_ids = [a.id for a in load_attacks()]
    df = generate_attack_scenario(args.events, args.seed, attack_ids, args.fraud_rate, args.difficulty)
    target = Path(args.out)
    target.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(target, index=False)
    print(f"generated {len(df):,} synthetic transactions -> {target}")
    print(f"fraud events: {int(df.ground_truth.sum()):,}; attacks available: {len(attack_ids)}")


if __name__ == "__main__":
    main()
