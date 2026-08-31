from __future__ import annotations

import subprocess
import sys

COMMANDS = [
    [sys.executable, "scripts/validate_catalog.py"],
    [sys.executable, "scripts/generate_data.py", "--events", "10000", "--seed", "829134", "--difficulty", "very-high", "--adaptation", "adversarial"],
    [sys.executable, "scripts/train_model.py"],
    [sys.executable, "scripts/evaluate_model.py"],
    [sys.executable, "scripts/evaluate_unseen.py"],
    [sys.executable, "scripts/benchmark.py"],
    [sys.executable, "scripts/run_closed_loop.py"],
]


def main() -> None:
    for command in COMMANDS:
        print("$", " ".join(command), flush=True)
        subprocess.run(command, check=True)
    print("\nMasterShield full backend experiment completed.")
    print("Generated artifacts are under ml/results/ and ml/models/.")


if __name__ == "__main__":
    main()
