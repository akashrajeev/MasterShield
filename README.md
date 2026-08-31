# MasterShield

MasterShield is a defensive AI payment-security research platform for the Mastercard Innovation Challenge @ GFF 2026.

The repository is intentionally split into a frontend and a reproducible research backend. The backend lives under `backend/` and implements the three challenge pillars:

`IDENTIFY -> GENERATE -> DEFEND`

followed by adversarial evaluation and hardening.

## Backend quickstart

```bash
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows: .venv\\Scripts\\activate
pip install -r backend/requirements.txt
```

Generate a reproducible synthetic dataset:

```bash
python scripts/generate_data.py --events 10000 --seed 829134
```

Train the detector and save the model artifact:

```bash
python scripts/train_model.py
```

Run held-out evaluation:

```bash
python scripts/evaluate_model.py
```

Evaluate generalization to unseen attack families:

```bash
python scripts/evaluate_unseen.py
```

Run the red-team/blue-team hardening loop:

```bash
python scripts/run_closed_loop.py
```

Start the API:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Swagger/OpenAPI is available at `/docs`.

## Backend design

- `data/attacks/attacks.json`: canonical machine-readable threat catalog.
- `backend/app/simulation`: synthetic financial-world primitives.
- `backend/app/generators`: reusable attack-family generators.
- `backend/app/features`: behavioral, transaction and graph/network features.
- `backend/app/detection`: trainable tabular + anomaly risk detector and explanations.
- `backend/app/evaluation`: metrics and grouped evaluation.
- `backend/app/adversarial`: synthetic detector-blind-spot search and train-on-failures hardening.
- `backend/app/storage`: lightweight SQLite experiment registry.
- `backend/app/api`: stable API contract for later frontend integration.

## Reproducibility

Experiments use explicit random seeds. Model training, evaluation and adversarial rounds can be regenerated locally from the scripts above. The final evaluation protocol keeps an untouched test split separate from the red-team search pool.

## Safety

All attacks, entities, transactions and network relationships are synthetic. The project does not execute real payment attacks, collect credentials, interact with financial institutions, or generate operational phishing/deepfake tooling. It simulates observable fraud telemetry for defensive research and model evaluation.
