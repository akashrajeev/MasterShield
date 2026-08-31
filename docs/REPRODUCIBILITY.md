# Reproducibility and Experiment Guide

This document explains how to regenerate MasterShield's synthetic data, model artifacts and evaluation outputs.

## 1. Environment

Recommended:

- Python 3.12
- Node.js compatible with the repository's Next.js version
- Git

Python dependencies are specified in `backend/requirements.txt`.

## 2. Create the Python environment

```bash
python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.venv\\Scripts\\Activate.ps1

pip install -r backend/requirements.txt
```

Run commands from the repository root. The repository workflows set `PYTHONPATH=.` so the `backend` package resolves consistently.

```bash
# macOS/Linux
export PYTHONPATH=.

# Windows PowerShell
$env:PYTHONPATH = "."
```

## 3. Validate the attack catalog

```bash
python scripts/validate_catalog.py
```

The canonical catalog contains exactly 120 synthetic defensive scenarios across 12 families. Validation checks IDs, generator mappings and supported generator families.

## 4. Generate synthetic data

```bash
python scripts/generate_data.py \
  --events 10000 \
  --seed 829134 \
  --difficulty very-high \
  --adaptation adversarial \
  --noise medium
```

The generator is deterministic for a given configuration and seed. Data is synthetic and does not represent real customers or payments.

## 5. Train the detector

```bash
python scripts/train_model.py
```

Detector v4.3 explicitly rejects attack and ground-truth metadata from the model feature matrix. Training selects an operating threshold on a validation split under a false-positive-rate constraint and records the feature schema and model metadata under `ml/models/`.

## 6. Evaluate the standard distribution

```bash
python scripts/evaluate_model.py
```

The output contains overall metrics plus breakdowns by attack, family, payment rail and difficulty, threshold sweeps and measured inference time.

Because the synthetic generator can make fraud highly separable, the standard result is a controlled distribution/separation diagnostic. It must not be presented as production fraud performance.

## 7. Evaluate unseen attack families

```bash
python scripts/evaluate_unseen.py
```

This withholds complete attack families from training and tests on those families separately under challenging synthetic conditions. Use this as the primary generalization-oriented result in the competition narrative.

## 8. Run the difficulty benchmark

```bash
python scripts/benchmark.py
```

The benchmark compares low, medium, high and very-high synthetic difficulty settings.

## 9. Run the adversarial hardening experiment

```bash
python scripts/run_closed_loop.py
```

The hardening protocol maintains an outer 60/20/20 split:

```text
60% training
20% red-team search
20% untouched final test
```

An additional calibration split is taken from the training population only. It selects the operating threshold under a maximum false-positive-rate constraint, then the detector is refit on the current training population and evaluated only on the untouched test set.

Each round searches bounded synthetic mutations for low-risk fraud cases, adds selected hard cases to training, recalibrates the threshold using training-only data and re-evaluates the untouched test population.

## 10. Run everything

```bash
python scripts/run_all.py
```

This executes catalog validation, data generation, model training, standard evaluation, unseen-family evaluation, difficulty benchmarking and closed-loop robustness testing.

## 11. Run the API

```bash
PYTHONPATH=. uvicorn backend.app.main:app --reload --port 8000
```

Then open:

```text
http://localhost:8000/docs
```

## 12. Run the frontend against the backend

Create `.env.local`:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then:

```bash
npm ci
npm run dev
```

The frontend uses `lib/api/` as its operational backend boundary.

## 13. Reproducibility checklist

Record:

- Git commit SHA
- Python and Node versions
- dependency environment
- seed
- attack IDs/families
- event count
- fraud rate
- difficulty
- adaptation mode
- noise level
- detector version
- feature schema
- operating threshold
- evaluation population/protocol
- final metrics

## 14. Why seeds matter

The simulator, attack assignment, network shaping and mutation search use seeded pseudo-random generation. Reusing the same seed and configuration should reproduce the same experiment distribution and transaction IDs. Floating-point and dependency-version differences can still cause small numerical changes, so reproducibility means deterministic experiment generation under the documented environment rather than byte-for-byte guarantees across arbitrary library versions.
