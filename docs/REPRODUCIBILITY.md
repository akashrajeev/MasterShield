# Reproducibility and Experiment Guide

This document explains how to regenerate MasterShield's synthetic data, model artifacts and evaluation outputs.

## 1. Environment

Recommended:

- Python 3.11+
- Node.js compatible with the repository's Next.js version
- Git

Python dependencies are specified in `backend/requirements.txt`.

## 2. Create the Python environment

```bash
python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1

pip install -r backend/requirements.txt
```

Because the scripts import the repository's `backend` package, run them from the repository root with the root directory on `PYTHONPATH`:

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

The canonical catalog contains 120 synthetic defensive scenarios across 12 families. Validation checks IDs, generator mappings and supported generator families.

## 4. Generate synthetic data

Example:

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

The current detector is leakage-safe: attack IDs, labels, scenario IDs/stages and other ground-truth metadata are excluded from model features. The script trains the detector, selects an operating threshold under a false-positive constraint, and writes local artifacts under `ml/models/` and `ml/results/`.

The model artifact should be regenerated after changes to the feature schema or detector version.

## 6. Evaluate on a held-out test population

```bash
python scripts/evaluate_model.py
```

The output contains overall metrics plus breakdowns by attack, family, payment rail and difficulty, a threshold sweep and measured inference time.

## 7. Evaluate unseen attack families

```bash
python scripts/evaluate_unseen.py
```

This experiment withholds complete attack families from training and tests on those families separately. It is stronger evidence of generalization than randomly splitting nearly identical rows.

## 8. Run the benchmark

```bash
python scripts/benchmark.py
```

The benchmark evaluates low, medium, high and very-high difficulty settings.

## 9. Run the adversarial loop

```bash
python scripts/run_closed_loop.py
```

The hardening implementation maintains separate training, red-team search/augmentation and untouched test populations.

## 10. Run everything

```bash
python scripts/run_all.py
```

This executes catalog validation, data generation, model training, standard evaluation, unseen-family evaluation, difficulty benchmarking and closed-loop robustness testing in sequence.

## 11. Run the API

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Then open:

```text
http://localhost:8000/docs
```

## 12. Run the frontend against the backend

Create `.env.local` from `.env.example`:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then:

```bash
npm ci
npm run dev
```

The frontend uses `lib/api/` as its backend boundary.

## 13. Reproducibility checklist

For a documented experiment record, capture:

- Git commit SHA
- Python version
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
- evaluation metrics

## 14. Why seeds matter

The simulator, attack assignment, network shaping and mutation search use seeded pseudo-random generation. Reusing the same seed and configuration should reproduce the same experiment distribution and transaction IDs. Floating-point and library-version differences can still produce small numerical differences, so reproducibility means deterministic experiment generation under the documented environment rather than byte-for-byte guarantees across arbitrary library versions.
