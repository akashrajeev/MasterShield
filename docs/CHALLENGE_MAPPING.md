# Challenge-to-Implementation Mapping

This document maps the implementation to the Mastercard Innovation Challenge @ GFF 2026 evaluation dimensions supplied in the challenge brief.

## 1. Identify — novel emerging GenAI payment fraud

### Requirement

Build a broad, deep landscape of plausible GenAI-powered payment fraud attacks across channels, rails and social-engineering surfaces.

### MasterShield implementation

The canonical catalog is `data/attacks/attacks.json` and currently contains 120 structured attack definitions across 12 families.

Each entry includes:

- attack family
- severity
- detection difficulty
- payment rails
- AI capabilities
- observable signals
- defense mappings
- novelty score
- evidence status
- generator mapping

The backend exposes `/api/catalog/summary`, `/api/attacks` and `/api/catalog/discover` for the web prototype.

`backend/app/identify/discovery.py` creates safe composite research hypotheses by recombining catalog attributes. These are defensive research concepts, not operational exploit instructions.

## 2. Generate — realistic simulation at scale

### Requirement

Generate realistic synthetic attacks and transactions with useful distributions, behaviors and edge cases.

### MasterShield implementation

The simulator creates a synthetic financial world containing:

- customers
- accounts
- merchants
- devices
- beneficiaries
- time-ordered transaction histories
- cross-channel scenarios
- graph relationships

The transaction generator models eight payment rails:

- UPI
- Cards
- Wallets
- IMPS
- NEFT
- RTGS
- BNPL
- Cross-border

Behavioral signals are derived from the synthetic history. One-hour and 24-hour velocity use prior events in time windows; account baselines are used for amount deviation and behavioral features.

Attack generators add family- and attack-specific telemetry. Multi-stage attacks can share a scenario identifier and stage order.

The generator is seeded so experiments can be recreated from a configuration and seed.

## 3. Defend — AI/ML detection

### Requirement

Detect the generated fraud while maintaining useful precision/recall and low false positives.

### MasterShield implementation

The detector uses three complementary components:

1. `HistGradientBoostingClassifier` supervised fraud probability
2. `IsolationForest` behavioral anomaly score
3. causal synthetic network risk derived from device, beneficiary and account relationships

The components are fused into a bounded risk score. The model returns a transaction-level explanation containing the highest-contributing features.

The decision layer supports:

- ALLOW
- MONITOR
- STEP_UP
- BLOCK_REVIEW

The threshold is configurable and evaluation reports how precision, recall, F1, FPR and FNR change as the threshold moves.

## 4. Evaluation rigor

MasterShield does not treat one random accuracy value as sufficient.

The evaluation suite reports:

- precision
- recall
- F1
- ROC-AUC
- PR-AUC
- false-positive rate
- false-negative rate
- confusion counts
- threshold curves
- performance by attack
- performance by family
- performance by rail
- performance by difficulty
- inference time

The unseen-family protocol withholds complete attack families from training. The adversarial hardening protocol also keeps an untouched final test population separate from the red-team search population.

## 5. Novelty

Attack definitions carry novelty scores and evidence statuses. The novelty engine can generate additional safe composite hypotheses from high-novelty catalog entries, rails and AI capability combinations.

The system distinguishes synthetic research concepts from documented or emerging evidence rather than presenting every hypothesis as an observed incident.

## 6. Real-world feasibility

The implementation is organized around a deployable streaming-oriented boundary:

```text
Payment event
    ↓
Feature extraction
    ↓
Behavior + graph signals
    ↓
ML detector
    ↓
Risk fusion
    ↓
Decision / analyst review
```

FastAPI provides the inference and simulation interface. The web prototype consumes it through a typed API client.

The current implementation is a research prototype using synthetic data and SQLite; production deployment would require authentication, authorization, durable managed storage, secrets management, high-availability inference, observability, privacy controls and organization-specific model governance.

## 7. Closed-loop requirement

The central differentiator is:

```text
Identify
  ↓
Generate
  ↓
Detect
  ↓
Measure failures
  ↓
Search for hard-to-detect variants
  ↓
Augment training
  ↓
Retest on untouched data
```

This is implemented under `backend/app/adversarial/` and exposed through `/api/adversarial/search` and `/api/adversarial/harden`.

## 8. Prototype experience

The frontend provides the web presentation of the same engine:

```text
Attack Library
   ↓
Simulator
   ↓
Generated Data
   ↓
Detection Lab
   ↓
Investigation
   ↓
Closed Loop
   ↓
Novelty Engine
```

The operational frontend reads the canonical backend attack catalog and simulation/detection results rather than maintaining an independent operational copy.

## 9. Safety and scope

All attack instances, payment events, accounts and identities are synthetic. The system is designed for controlled defensive research and does not perform real-world fraud, credential collection, payment execution, victim contact or operational exploit generation.
