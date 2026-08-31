# Model and Evaluation Methodology

## Overview

MasterShield uses a transparent multi-signal detector over synthetic payment telemetry. It is intentionally modular so the project can compare feature groups and attack conditions rather than treating a single aggregate score as proof of security.

## Input

The feature pipeline produces transaction, behavioral, identity/device, contextual and network features from synthetic event history. Ground-truth labels and attack/scenario metadata are excluded from the model feature matrix and retained only for evaluation.

### Transaction features

- amount
- amount z-score against account baseline
- one-hour velocity
- 24-hour velocity
- beneficiary age
- account age
- payment rail

### Behavioral features

- behavioral deviation
- normal daily transaction volume
- geo distance
- cross-rail activity
- amount/behavior interaction
- velocity and account-age flags

### Identity, device and context

- device trust
- device reuse
- identity consistency
- merchant risk
- urgency
- approval-path change
- content risk

### Network

- account/beneficiary degree
- beneficiary fan-out
- device reuse
- account outflow
- beneficiary inflow
- counterparty count
- network concentration
- graph risk

## Leakage prevention

The detector explicitly rejects feature matrices containing ground-truth or attack metadata such as `ground_truth`, `attack_id`, `attack_family`, `scenario_id`, `scenario_stage`, and `multi_stage_scenario`. The generator may retain those fields for evaluation and investigation, but `build_features()` drops them before model training/inference.

## Detector

The baseline classifier is `HistGradientBoostingClassifier` from scikit-learn. It is paired with `IsolationForest` and a causal network-risk signal.

The model stores anomaly calibration bounds learned from the training population. This avoids rescaling anomaly scores against each new batch at inference time.

The current detector version is `4.3`.

## Risk fusion

```text
risk = 0.68 * supervised_probability
     + 0.17 * anomaly_score
     + 0.15 * graph_signal
```

The result is clipped to `[0, 1]`.

## Decision policy

The risk threshold is configurable. Decisions are mapped to:

```text
lower risk       -> ALLOW
moderate risk    -> MONITOR
higher risk      -> STEP_UP
highest risk     -> BLOCK_REVIEW
```

The exact boundaries are implemented in `backend/app/detection/thresholds.py` and are intentionally configurable for threshold experiments.

## Metrics

The evaluation layer calculates:

- Precision
- Recall
- F1
- ROC-AUC
- PR-AUC
- False-positive rate
- False-negative rate
- True positives
- True negatives
- False positives
- False negatives

It also supports threshold sweeps and selection of an operating point subject to a maximum false-positive rate.

## Grouped evaluation

Metrics are evaluated by:

- attack ID
- attack family
- attack difficulty
- payment rail

This helps identify blind spots instead of hiding them inside one aggregate score.

## Unseen-family test

`scripts/evaluate_unseen.py` withholds two complete attack families from the training data and tests only on those families. The test population uses very-high difficulty and adversarial adaptation settings.

This is the strongest generalization-oriented result in the repository because entire attack families are withheld from training. It remains a synthetic experiment and is not evidence that the model will generalize to every real-world fraud family.

## Interpreting the standard synthetic benchmark

The standard generated distribution is intentionally controlled and therefore can be highly separable. A perfect or near-perfect score on that benchmark is a **synthetic-distribution separation diagnostic**, not a claim of production fraud performance.

For the final competition write-up, use the unseen-family result and closed-loop robustness results as the primary evidence of generalization/adaptation. Report the standard 50k-event benchmark as a controlled reference and explicitly note when synthetic features make the task easier than a live payment environment.

## Adversarial hardening

`backend/app/adversarial/hardening.py` maintains an outer split:

```text
60% training
20% red-team search
20% untouched final test
```

The hardening workflow takes an additional calibration split from the training population only. That calibration set is used to select the operating threshold under a maximum false-positive-rate constraint. The final model is then refit on the complete current training population, while the untouched test population remains isolated.

Each hardening round:

1. scores synthetic fraud candidates;
2. searches bounded mutations for low-risk variants;
3. adds selected hard cases to the training population;
4. recalibrates the operating threshold using training-only data;
5. refits the detector;
6. evaluates only on the untouched test population.

This prevents threshold tuning or training from using the final test population.

The hardening result should be interpreted as a robustness experiment. The goal is to improve or maintain detection on previously untouched adversarial-style synthetic data, not to manufacture a higher score by evaluating on the same hard examples used for augmentation.

## Explainability

The detector exposes model feature importance plus transaction-specific signal strengths. The Investigation UI can use these values to explain why a synthetic event was assigned a particular risk score.

This is feature-based attribution, not a claim of full SHAP methodology.

## Re-running results

After changing the feature schema or detector version, run:

```bash
$env:PYTHONPATH="."  # Windows PowerShell
python scripts/train_model.py
python scripts/evaluate_model.py
python scripts/evaluate_unseen.py
python scripts/benchmark.py
python scripts/run_closed_loop.py
```

Use the resulting `ml/results/*.json` files as the source for final benchmark claims. Do not reuse older artifacts generated with a previous feature schema.

## What the benchmark does not claim

The project is intentionally a research prototype. Synthetic data and a trained prototype classifier cannot establish production-grade fraud performance. Results are meaningful only within the documented synthetic distributions, generator assumptions, software environment and experiment seeds.

Any final write-up should report measured results generated by the repository and label the evaluation population and protocol next to each metric.
