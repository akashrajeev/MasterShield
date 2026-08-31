# Backend Quickstart

From repository root:

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r backend/requirements.txt
python scripts/run_demo.py
uvicorn backend.app.main:app --reload
```

API:

- `GET /health` — service health
- `GET /api/attacks` — canonical attack catalog (120+)
- `GET /api/attacks/{attack_id}` — one attack definition
- `POST /api/simulate` — deterministic synthetic payment simulation
- `POST /api/detect` — train/evaluate detector on a held-out split
- `POST /api/closed-loop` — red-team mutation search against the detector

Example request:

```json
{
  "events": 5000,
  "seed": 829134,
  "fraud_rate": 0.12,
  "difficulty": "very-high"
}
```

## Reproducibility

The seed is part of every simulation configuration. Reusing the same seed and configuration reproduces the synthetic experiment.

## Important evaluation note

Metrics are computed on a held-out test split. Do not report training-set metrics as model performance.
