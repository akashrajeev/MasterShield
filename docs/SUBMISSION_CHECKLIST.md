# MasterShield Submission Checklist

Use this checklist immediately before submitting the repository/write-up.

## Repository

- [ ] GitHub repository is public and contains the merged frontend and backend.
- [ ] `README.md` explains the project, architecture, setup, experiments and safety boundary.
- [ ] `docs/ARCHITECTURE.md` describes the system components and data flow.
- [ ] `docs/CHALLENGE_MAPPING.md` maps the implementation to Identify, Generate, Defend, novelty and feasibility criteria.
- [ ] `docs/MODEL_AND_EVALUATION.md` documents the detector and evaluation methodology.
- [ ] `docs/REPRODUCIBILITY.md` documents environment, commands, seeds and experiment protocol.
- [ ] `backend/README.md` documents the backend API and experiment runner.

## Identify

- [ ] `data/attacks/attacks.json` contains at least 120 unique attack definitions.
- [ ] Every attack has a generator mapping.
- [ ] Attack families, rails, AI capabilities, observable signals and defenses are populated.
- [ ] Evidence status is used honestly; synthetic hypotheses are not presented as documented incidents.

## Generate

- [ ] Synthetic world creation is deterministic from a seed.
- [ ] Transaction histories are time ordered.
- [ ] Ground truth is available for generated fraud events.
- [ ] Attack difficulty/adaptation/noise settings work.
- [ ] Cross-channel scenarios preserve scenario identifiers and stage order.
- [ ] Network/AML relationships are represented in the generated data.

## Defend

- [ ] Detector training completes from a clean environment.
- [ ] Model artifact and feature schema are generated locally.
- [ ] `/api/predict` works for individual synthetic events.
- [ ] Detection explanations are available for investigations.
- [ ] Decision thresholds are configurable.

## Evaluate

- [ ] `scripts/evaluate_model.py` completes successfully.
- [ ] Precision, recall, F1, ROC-AUC and PR-AUC are recorded.
- [ ] FPR/FNR and confusion counts are recorded.
- [ ] Threshold sweep is available.
- [ ] Results are broken down by attack/family/rail/difficulty.
- [ ] `scripts/evaluate_unseen.py` completes and documents the held-out-family protocol.
- [ ] `scripts/benchmark.py` completes across difficulty levels.

## Adapt

- [ ] `scripts/run_closed_loop.py` completes.
- [ ] Red-team search uses a separate search/augmentation population.
- [ ] Final evaluation uses an untouched test population.
- [ ] Hardening rounds are recorded with model version and metrics.

## Frontend integration

- [ ] `NEXT_PUBLIC_API_URL` points to the FastAPI service in the submission environment.
- [ ] Attack Library loads from the backend.
- [ ] Simulator creates a backend simulation.
- [ ] Generated Data displays backend-generated synthetic events.
- [ ] Detection Lab displays backend-generated metrics.
- [ ] Investigation displays backend model explanations.
- [ ] Closed Loop displays backend search/hardening results.
- [ ] Judge Demo follows the same backend-driven workflow.

## Claims and evidence

Before writing any final benchmark number into the Kaggle write-up:

1. Run the corresponding repository script.
2. Save the generated JSON result.
3. Record the seed, event count, model version and threshold.
4. Copy only measured values into the write-up.
5. Clearly label results as synthetic research results.

Do not use placeholder frontend numbers as experimental evidence.

## Final local validation

```bash
python scripts/validate_catalog.py
python scripts/run_all.py
```

Then start the API:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

And start the frontend:

```bash
npm ci
npm run dev
```

Perform the complete workflow:

```text
Dashboard
  -> Attack Library
  -> Attack Detail
  -> Simulator
  -> Generated Data
  -> Detection Lab
  -> Investigation
  -> Closed Loop
  -> Novelty Engine
  -> Judge Demo
```

## Safety statement

All attack scenarios, identities, payment events and transactions are synthetic. The project is intended for defensive research and controlled model evaluation.
