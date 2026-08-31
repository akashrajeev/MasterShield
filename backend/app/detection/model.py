from __future__ import annotations

from pathlib import Path
import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier, IsolationForest
from sklearn.inspection import permutation_importance
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support, roc_auc_score

from .thresholds import decision


class Detector:
    VERSION = "3.0"

    def __init__(self):
        self.classifier = HistGradientBoostingClassifier(
            max_iter=180, learning_rate=.07, max_leaf_nodes=31,
            l2_regularization=.3, random_state=42,
        )
        self.anomaly = IsolationForest(n_estimators=160, contamination=.05, random_state=42)
        self.fitted = False
        self.feature_names: list[str] = []
        self.feature_importance_: dict[str, float] = {}

    def fit(self, X, y):
        self.feature_names = list(X.columns)
        self.classifier.fit(X, y)
        self.anomaly.fit(X)
        # A small permutation sample creates defensible global feature importance without
        # making every inference expensive.
        sample = X.iloc[: min(len(X), 1200)]
        labels = np.asarray(y)[: len(sample)]
        if len(np.unique(labels)) > 1:
            perm = permutation_importance(self.classifier, sample, labels, n_repeats=3, random_state=42, scoring="roc_auc")
            vals = np.maximum(perm.importances_mean, 0)
            total = vals.sum() or 1.0
            self.feature_importance_ = {name: float(v / total) for name, v in zip(self.feature_names, vals)}
        else:
            self.feature_importance_ = {name: 1.0 / max(len(self.feature_names), 1) for name in self.feature_names}
        self.fitted = True
        return self

    def predict_scores(self, X):
        if not self.fitted:
            raise RuntimeError("Detector must be fitted before inference")
        supervised = self.classifier.predict_proba(X)[:, 1]
        raw_anomaly = -self.anomaly.score_samples(X)
        # Fixed calibration prevents test-batch min/max leakage and keeps scores comparable.
        anomaly = 1.0 / (1.0 + np.exp(-3.0 * (raw_anomaly - 0.55)))
        return np.clip(.82 * supervised + .18 * anomaly, 0, 1)

    def evaluate(self, X, y, threshold=.5):
        scores = self.predict_scores(X)
        pred = (scores >= threshold).astype(int)
        precision, recall, f1, _ = precision_recall_fscore_support(y, pred, average="binary", zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
        auc = roc_auc_score(y, scores) if len(np.unique(y)) > 1 else 0.0
        return {
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
            "roc_auc": float(auc),
            "false_positive_rate": float(fp / max(fp + tn, 1)),
            "false_negative_rate": float(fn / max(fn + tp, 1)),
            "true_positives": int(tp), "true_negatives": int(tn),
            "false_positives": int(fp), "false_negatives": int(fn),
        }

    def decisions(self, scores, threshold=.5):
        return [decision(float(s), threshold) for s in scores]

    def explain(self, row, score: float, threshold: float = .5) -> dict:
        values = row.to_dict() if hasattr(row, "to_dict") else dict(row)
        contributions = []
        for name in self.feature_names:
            value = float(values.get(name, 0.0))
            importance = float(self.feature_importance_.get(name, 0.0))
            contributions.append({"feature": name, "value": value, "importance": importance, "contribution": abs(value) * importance})
        contributions.sort(key=lambda x: x["contribution"], reverse=True)
        return {
            "risk_score": float(score),
            "decision": decision(float(score), threshold),
            "prediction": int(score >= threshold),
            "top_signals": contributions[:6],
        }

    def save(self, path: str | Path) -> None:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, target)

    @classmethod
    def load(cls, path: str | Path) -> "Detector":
        return joblib.load(path)
