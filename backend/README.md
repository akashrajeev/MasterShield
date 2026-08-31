# MasterShield Backend

Defensive research backend for the Mastercard Innovation Challenge @ GFF 2026.

This service implements the non-frontend parts of the MasterShield closed loop:

`IDENTIFY -> GENERATE -> DEFEND -> EVALUATE -> ADAPT`

## Scope

- Canonical attack catalog with 120+ defensive research scenarios
- Deterministic synthetic payment-world generation
- Parameterized attack scenario generation
- Feature extraction for transaction, behavior, identity and network signals
- Trainable fraud detector baseline
- Evaluation by attack family, rail, difficulty and novelty
- Adversarial simulation loop that searches for hard-to-detect synthetic variants
- FastAPI service for later frontend integration
- SQLite experiment storage
- Reproducible CLI scripts and seeded experiments

## Safety

All data and scenarios are synthetic. The backend does not execute real payment attacks, collect credentials, interact with financial institutions, or create operational phishing/deepfake tooling.

## Initial implementation order

1. Attack intelligence
2. Synthetic payment world
3. Scenario generators
4. Feature pipeline
5. Detector + evaluation
6. Adversarial loop
7. API integration

## Development

Create a virtual environment and install `requirements.txt` from this directory or the repository root once the root development environment is added.
