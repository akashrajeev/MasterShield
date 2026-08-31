import argparse
from pathlib import Path
from backend.app.generators.transaction import generate_transactions

p = argparse.ArgumentParser()
p.add_argument('--events', type=int, default=10000)
p.add_argument('--seed', type=int, default=829134)
p.add_argument('--out', default='data/sample/transactions.csv')
a = p.parse_args()
Path(a.out).parent.mkdir(parents=True, exist_ok=True)
generate_transactions(a.events, a.seed).to_csv(a.out, index=False)
print(f'generated {a.events} synthetic transactions -> {a.out}')
