import subprocess
import sys

steps = [
    [sys.executable, "scripts/generate_data.py", "--events", "10000", "--seed", "829134"],
    [sys.executable, "scripts/evaluate_model.py"],
    [sys.executable, "scripts/run_closed_loop.py"],
]
for command in steps:
    print("$", " ".join(command))
    subprocess.run(command, check=True)
print("MasterShield closed-loop demo completed. Results are under ml/results/.")
