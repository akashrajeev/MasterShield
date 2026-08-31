## Architecture status

Implemented in the backend-foundation branch:

- Identify: machine-readable attack catalog, generator mapping, novelty heuristic, evidence-status boundary.
- Generate: deterministic synthetic customers/accounts/merchants/devices/beneficiaries, family-aware transaction simulation, cross-channel scenario composition.
- Defend: gradient-boosting classifier, Isolation Forest anomaly signal, network-derived features, risk scoring, explanation utilities.
- Evaluate: held-out metrics and unseen-family evaluation scripts.
- Red-team loop: synthetic mutation and detector blind-spot search.
- Ops: FastAPI entrypoint, SQLite experiment storage, Dockerfile, CLI scripts, tests.

Next backend milestones before frontend integration: attack-family-specific generators, true graph aggregation across event histories, persisted simulation jobs and sampled events, model artifact/version endpoints, and train-on-failures hardening rounds.
