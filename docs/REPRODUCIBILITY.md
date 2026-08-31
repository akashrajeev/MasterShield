# Reproducibility and Experiment Guide

This document explains how to regenerate MasterShield's synthetic data, model artifacts and evaluation outputs.

## 1. Environment

Recommended:

- Python 3.11+ (the CI-tested environment is authoritative)
- Node.js compatible with the repository's Next.js version
- Git

Python dependencies are defined in `backend/requirements.txt`.

## 2. Create the Python environment

```bash
python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1

pip install -r backend/requirements.txt
```

### Import path

The scripts import the repository's `backend` package. From a fresh clone, set the repository root on `PYTHONPATH` before running them.

macOS/Linux:

```bash
export PYTHONPATH=.
```

Windows PowerShell:

```powershell
$env:PYTHONPATH = "."
```

Alternatively, run the commands from an environment/configuration that already exposes the repository root on the Python import path (as CI does).

## 3. Validate the attack catalog

```bash
python scripts/validate_catalog.py
```

The canonical catalog is `data/attacks/attacks.json`. The current validated target is 120 scenarios across 12 families. Legacy frontend/reference data may contain older counts and is not the operational source of truth.

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

The detector feature set intentionally excludes scenario-generation metadata that would leak the fraud label. This is important: benchmark numbers should be regenerated after code changes rather than copied from older model artifacts.

The script writes local artifacts under `ml/models/` and `ml/results/`.

## 6. Evaluate on a held-out test population

```bash
python scripts/evaluate_model.py
```

The output contains overall metrics plus breakdowns by attack, family, payment rail and difficulty, as well as threshold analysis and measured inference time.

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

The hardening implementation maintains separate training, red-team search/augmentation, and untouched test populations.

## 10. Run everything

```bash
python scripts/run_all.py
```

This executes catalog validation, data generation, model training, standard evaluation, unseen-family evaluation, difficulty benchmarking, and closed-loop robustness testing in sequence.

## 11. Run the API

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Then open:

```text
http://localhost:8000/docs
```

The API auto-retrains an in-memory detector when a saved artifact does not match the current feature schema/version, so local inference remains compatible after model feature changes. For documented benchmark results, explicitly rerun the training/evaluation scripts.

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

The simulator, attack assignment, network shaping and mutation search all use seeded pseudo-random generation. Reusing the same seed and configuration should reproduce the same experiment distribution and transaction IDs. Floating-point and library-version differences can still produce small numerical differences, so reproducibility should be understood as deterministic experiment generation under the documented software environment rather than byte-for-byte guarantees across arbitrary library versions.
