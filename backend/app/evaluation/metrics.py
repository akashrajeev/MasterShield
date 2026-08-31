from __future__ import annotations

import numpy as np
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def _bounded(value: float) -> float:
    return float(np.clip(value, 0.0, 1.0))


def binary_metrics(y_true, scores, threshold: float = .5) -> dict:
    y = np.asarray(y_true).astype(int)
    s = np.asarray(scores, dtype=float)
    pred = (s >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    return {
        "precision": _bounded(precision_score(y, pred, zero_division=0)),
        "recall": _bounded(recall_score(y, pred, zero_division=0)),
        "f1": _bounded(f1_score(y, pred, zero_division=0)),
        "roc_auc": _bounded(roc_auc_score(y, s)) if len(np.unique(y)) > 1 else 0.0,
        "pr_auc": _bounded(average_precision_score(y, s)) if len(np.unique(y)) > 1 else 0.0,
        "false_positive_rate": _bounded(fp / max(fp + tn, 1)),
        "false_negative_rate": _bounded(fn / max(fn + tp, 1)),
        "true_positives": int(tp), "true_negatives": int(tn),
        "false_positives": int(fp), "false_negatives": int(fn),
    }


def metrics_by_group(df, scores, group_col: str, threshold: float = .5) -> dict:
    out = {}
    scores_arr = np.asarray(scores)
    for key, group in df.groupby(group_col, dropna=False):
        idx = group.index.to_numpy()
        out[str(key)] = binary_metrics(df.loc[idx, "ground_truth"], scores_arr[idx], threshold)
    return out


def threshold_sweep(y_true, scores, thresholds: list[float] | None = None) -> list[dict]:
    thresholds = thresholds or [round(x, 2) for x in np.arange(.30, .91, .05)]
    return [{"threshold": t, **binary_metrics(y_true, scores, t)} for t in thresholds]


def select_operating_threshold(y_true, scores, max_false_positive_rate: float = .02) -> dict:
    candidates = threshold_sweep(y_true, scores, [round(x, 2) for x in np.arange(.20, .91, .01)])
    feasible = [item for item in candidates if item["false_positive_rate"] <= max_false_positive_rate]
    pool = feasible or candidates
    return max(pool, key=lambda item: (item["f1"], item["recall"], -item["false_positive_rate"]))
