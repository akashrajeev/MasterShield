# MasterShield Backend

MasterShield is a defensive AI payment-security research platform for the Mastercard Innovation Challenge @ GFF 2026.

The backend implements a reproducible closed loop:

`IDENTIFY -> GENERATE -> DEFEND -> EVALUATE -> ADAPT`

## What is implemented

### Identify

- 120 synthetic defensive research attack scenarios
- 12 attack families
- Severity and difficulty labels
- Payment-rail coverage
- AI-capability metadata
- Observable detection signals
- Defense mappings
- Novelty scoring
- Safe composite-threat discovery
- Catalog validation

### Generate

The simulator creates a synthetic payment world containing:

- customers
- accounts
- merchants
- devices
- beneficiaries
- payment transactions
- transaction histories
- multi-stage scenarios
- cross-channel campaigns
- synthetic AML/mule relationships

Generation is deterministic from a supplied seed.

Attack instances are created through reusable family generators. The catalog's `generator_id` selects family behavior while `observable_signals`, novelty and difficulty make each attack definition materially influence the generated telemetry.

### Defend

The detector combines three signals:

1. Supervised gradient-boosting fraud probability
2. Isolation Forest anomaly score
3. Causal network/graph risk

The final score is a weighted risk fusion. Thresholds map risk into:

- ALLOW
- MONITOR
- STEP_UP
- BLOCK_REVIEW

The model stores training-time anomaly calibration values and feature importance so inference is not normalized against the current test batch.

### Evaluate

The evaluation suite reports:

- Precision
- Recall
- F1
- ROC-AUC
- PR-AUC
- False-positive rate
- False-negative rate
- Confusion counts
- Threshold sweep
- Performance by attack
- Performance by family
- Performance by rail
- Performance by difficulty
- Inference latency

The unseen-family experiment removes complete attack families from training and tests on those families at higher difficulty/adaptation, avoiding simple random-row leakage.

### Adapt

The red-team loop searches the synthetic fraud feature space for variants that receive low detector risk, then the blue team can retrain on those failures.

The hardening protocol keeps three populations separate:

- Training data
- Red-team search/augmentation data
- Untouched final test data

This prevents the closed-loop experiment from simply evaluating on examples it learned from.

## API

Run:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Interactive OpenAPI docs are exposed at `/docs`.

Core routes:

```text
GET  /health
GET  /api/catalog/summary
GET  /api/catalog/discover
GET  /api/attacks
GET  /api/attacks/{attack_id}

POST /api/simulate
GET  /api/simulations/{simulation_id}
GET  /api/simulations/{simulation_id}/events
GET  /api/simulations/{simulation_id}/results
GET  /api/simulations/{simulation_id}/rounds

POST /api/detect
POST /api/predict
GET  /api/experiments/{experiment_id}
GET  /api/models/current

GET  /api/transactions/{transaction_id}
GET  /api/transactions/{transaction_id}/assessment

POST /api/adversarial/search
POST /api/adversarial/harden
```

## Reproduce the experiments

From the repository root:

```bash
python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows
# .venv\\Scripts\\activate

pip install -r backend/requirements.txt

python scripts/validate_catalog.py
python scripts/generate_data.py --events 10000 --seed 829134 --difficulty very-high --adaptation adversarial
python scripts/train_model.py
python scripts/evaluate_model.py
python scripts/evaluate_unseen.py
python scripts/benchmark.py
python scripts/run_closed_loop.py
```

Or run the complete sequence:

```bash
python scripts/run_all.py
```

Generated model artifacts and experiment databases are intentionally ignored by git. The commands above regenerate them locally from the versioned source, seed and configuration.

## Repository design

```text
backend/app/identify       threat catalog + discovery
backend/app/simulation     synthetic financial world
backend/app/generators     attack-aware scenario generation
backend/app/features       causal behavioral + network features
backend/app/detection      detector + serving + explanation
backend/app/evaluation     metrics + grouped experiments
backend/app/adversarial    mutation + hardening loop
backend/app/storage        SQLite experiment registry
backend/app/api            stable FastAPI contract

scripts/                   reproducible experiment entrypoints
data/attacks/              canonical attack catalog
ml/                        generated model/result locations
```

## Documentation

- `../README.md` — complete project and system overview
- `../docs/ARCHITECTURE.md` — component and data-flow architecture
- `../docs/API.md` — API contract and request examples
- `../docs/MODEL_AND_EVALUATION.md` — model and evaluation methodology
- `../docs/REPRODUCIBILITY.md` — experiment reproduction guide
- `../docs/CHALLENGE_MAPPING.md` — challenge criteria mapping
- `../docs/SUBMISSION_CHECKLIST.md` — final submission verification

## Safety boundary

Everything is synthetic and defensive. The backend does not execute real payment attacks, obtain credentials, contact victims, interact with banks/merchants, or generate operational phishing/deepfake material. GenAI concepts are represented as abstract scenario metadata and observable payment-security telemetry for research and detection evaluation.
