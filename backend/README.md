# MasterShield Backend

Defensive research backend for the Mastercard Innovation Challenge @ GFF 2026.

The backend is the reproducible computational core behind the separate Next.js frontend:

`IDENTIFY -> GENERATE -> DEFEND -> EVALUATE -> ADAPT`

## What is implemented

### Identify

- Canonical machine-readable attack catalog with 120+ synthetic research scenarios.
- 12 attack families and payment-rail mappings.
- Severity, difficulty, novelty and generator metadata.
- Evidence status distinguishes documented/emerging/research/synthetic-composite concepts.

### Generate

- Deterministic synthetic customers, accounts, merchants, devices and beneficiaries.
- History-aware synthetic transaction streams.
- Family-aware attack telemetry profiles.
- Multi-stage/cross-channel scenario IDs.
- Context signals such as urgency, approval-path change, content risk and cross-rail activity.
- Synthetic payment-network graph construction and network-risk features.
- Bounded adversarial mutation of synthetic telemetry.

### Defend

- Gradient-boosting supervised classifier.
- Isolation Forest anomaly component.
- Fused risk score.
- Threshold-based decision engine: ALLOW / MONITOR / STEP_UP / BLOCK_REVIEW.
- Permutation-based feature importance and transaction-level explanations.

### Evaluate

- Precision, recall, F1, ROC-AUC.
- False-positive and false-negative rates.
- Confusion counts.
- Threshold sweeps.
- Metrics by attack and payment rail.
- Held-out evaluation.
- Unseen attack-family generalization experiment.

### Adapt

The red team searches synthetic fraud variants that minimize detector risk. The blue team can then retrain on the hard variants while scoring improvement on an untouched test set. This prevents the hardening experiment from learning directly from its final test set.

## Architecture

```text
Attack Catalog
      |
      v
Synthetic Payment World
      |
      +--> Scenario Generators
      |
      +--> Transaction History
      |
      +--> Payment Graph
      |
      v
Feature Pipeline
      |
      +--> Supervised Model
      +--> Anomaly Model
      +--> Network Signals
      |
      v
Risk Fusion
      |
      v
Evaluation
      |
      v
Red-Team Mutation
      |
      v
Blue-Team Hardening
      |
      +------> repeat
```

## CLI

From the repository root:

```bash
python scripts/generate_data.py --events 10000 --seed 829134 --difficulty very-high
python scripts/train_model.py
python scripts/evaluate_model.py
python scripts/evaluate_unseen.py
python scripts/run_closed_loop.py
python scripts/run_all.py
```

Generated model artifacts are written under `ml/models/`; experiment reports are written under `ml/results/`.

## API

Start:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Core endpoints:

```text
GET  /health
GET  /api/catalog/summary
GET  /api/attacks
GET  /api/attacks/{attack_id}
POST /api/simulate
POST /api/detect
GET  /api/models/current
GET  /api/transactions/{transaction_id}
GET  /api/transactions/{transaction_id}/assessment
POST /api/adversarial/search
POST /api/adversarial/harden
```

Swagger/OpenAPI: `http://localhost:8000/docs`

## Reproducibility

Experiments use explicit seeds and deterministic generators. The closed-loop hardening protocol has three conceptual datasets: training data, a red-team search/validation pool, and an untouched test split. This separation is important for credible before/after reporting.

## Safety

All attacks, identities, accounts, transactions and network relationships are synthetic. The backend does not execute real payment attacks, collect credentials, interact with financial institutions, or generate operational phishing/deepfake tooling. It models observable defensive telemetry only.
