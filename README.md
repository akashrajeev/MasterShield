# MasterShield

MasterShield is a defensive AI payment-security research platform for the Mastercard Innovation Challenge @ GFF 2026.

The repository is intentionally split into:

- the presentation frontend under the existing Next.js application
- a reproducible research backend under `backend/`

The backend implements the complete challenge loop:

`IDENTIFY -> GENERATE -> DEFEND -> EVALUATE -> ADAPT`

## Backend status

The backend branch contains:

- 120 synthetic defensive attack scenarios across 12 families
- deterministic synthetic payment-world generation
- account, merchant, device and beneficiary relationships
- causal transaction-history and network features
- attack-specific and multi-stage scenario generation
- gradient-boosting + anomaly + graph risk detection
- precision/recall/F1/ROC-AUC/PR-AUC/FPR/FNR evaluation
- threshold analysis and operating-threshold selection
- unseen-family generalization evaluation
- adversarial detector-blind-spot search
- train-on-failures hardening with an untouched final test set
- transaction-level model explanations
- FastAPI service and OpenAPI documentation
- SQLite experiment persistence
- reproducible CLI scripts and CI tests

All attack and transaction data are synthetic. No real payments, credentials or external financial systems are used.

## Backend quickstart

```bash
python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows
# .venv\\Scripts\\activate

pip install -r backend/requirements.txt

python scripts/validate_catalog.py
python scripts/run_all.py
```

Start the API:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

OpenAPI/Swagger: `http://localhost:8000/docs`

## Reproducibility

Experiments use explicit random seeds. The repository does not commit generated model binaries or the local SQLite experiment database; these are recreated from the versioned code and commands above.

See `backend/README.md` for the architecture, experiment protocol and API contract.
