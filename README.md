# MasterShield

MasterShield is a defensive AI payment-security research platform for the Mastercard Innovation Challenge @ GFF 2026.

## System architecture

```text
Next.js UI
   │
   │ REST/JSON
   ▼
FastAPI Research API
   ├── Identify: 120 attack scenarios / 12 families
   ├── Generate: seeded synthetic payment world + scenarios
   ├── Defend: supervised + anomaly + graph risk
   ├── Evaluate: held-out metrics / threshold analysis
   └── Adapt: adversarial search + hardening
```

## Run locally

### 1. Backend

```bash
python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r backend/requirements.txt
python scripts/validate_catalog.py
python scripts/run_all.py
uvicorn backend.app.main:app --reload --port 8000
```

Swagger: `http://localhost:8000/docs`

### 2. Frontend

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Integrated flow

`Attack Library -> Simulator -> Generated Data -> Detection Lab -> Investigation -> Closed Loop -> Novelty Engine`

The operational frontend reads attack definitions and simulation/detection results from FastAPI. The local TypeScript simulation engine is retained only for legacy/reference code and is not the source of truth for the integrated routes.

## Challenge pillars

### Identify

120 synthetic defensive research scenarios across 12 attack families, with evidence status, novelty, payment-rail coverage, observable signals and generator mappings.

### Generate

Deterministic synthetic customers, accounts, merchants, devices, beneficiaries, transaction histories, attack-specific telemetry, graph relationships and multi-stage scenarios.

### Defend

Trainable supervised model, anomaly model, causal network signals, fused risk score, threshold decisions and transaction-level explanations.

### Evaluate / Adapt

Known and unseen-family evaluation, threshold sweeps, attack/rail/difficulty benchmarks, red-team search, train-on-failures hardening and untouched final tests.

## Safety boundary

This repository is a synthetic defensive security research environment. It does not execute real payment attacks, collect credentials, contact victims, or interact with banks/merchants.
