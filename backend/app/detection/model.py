from __future__ import annotations

from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier, IsolationForest
from sklearn.inspection import permutation_importance
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support, roc_auc_score

from .thresholds import decision


class Detector:
    """Reproducible synthetic-payment fraud detector.

    The model combines a supervised probability with a one-class anomaly signal.
    It is deliberately small enough for local reproduction and later live-demo use.
    """

    VERSION = "4.0"

    def __init__(self) -> None:
        self.classifier = HistGradientBoostingClassifier(
            max_iter=220,
            learning_rate=.06,
            max_leaf_nodes=31,
            l2_regularization=.30,
            random_state=42,
        )
        self.anomaly = IsolationForest(
            n_estimators=180,
            contamination=.05,
            random_state=42,
        )
        self.fitted = False
        self.feature_names: list[str] = []
        self.feature_importance_: dict[str, float] = {}
        self.anomaly_min = 0.0
        self.anomaly_max = 1.0

    def fit(self, X, y):
        self.feature_names = list(X.columns)
        self.classifier.fit(X, y)
        self.anomaly.fit(X)
        raw = -self.anomaly.score_samples(X)
        self.anomaly_min = float(np.quantile(raw, .01))
        self.anomaly_max = float(np.quantile(raw, .99))
        if self.anomaly_max <= self.anomaly_min:
            self.anomaly_max = self.anomaly_min + 1.0

        sample = X.iloc[: min(len(X), 1500)]
        labels = np.asarray(y)[: len(sample)]
        if len(np.unique(labels)) > 1:
            perm = permutation_importance(
                self.classifier,
                sample,
                labels,
                n_repeats=3,
                random_state=42,
                scoring="roc_auc",
            )
            values = np.maximum(perm.importances_mean, 0)
            total = float(values.sum()) or 1.0
            self.feature_importance_ = {
                name: float(value / total)
                for name, value in zip(self.feature_names, values)
            }
        else:
            weight = 1.0 / max(len(self.feature_names), 1)
            self.feature_importance_ = {name: weight for name in self.feature_names}
        self.fitted = True
        return self

    def predict_scores(self, X):
        if not self.fitted:
            raise RuntimeError("Detector must be fitted before inference")
        supervised = self.classifier.predict_proba(X)[:, 1]
        raw = -self.anomaly.score_samples(X)
        anomaly = np.clip(
            (raw - self.anomaly_min) / (self.anomaly_max - self.anomaly_min),
            0,
            1,
        )
        return np.clip(.82 * supervised + .18 * anomaly, 0, 1)

    def evaluate(self, X, y, threshold=.5):
        scores = self.predict_scores(X)
        pred = (scores >= threshold).astype(int)
        precision, recall, f1, _ = precision_recall_fscore_support(
            y, pred, average="binary", zero_division=0
        )
        tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
        auc = roc_auc_score(y, scores) if len(np.unique(y)) > 1 else 0.0
        return {
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
            "roc_auc": float(auc),
            "false_positive_rate": float(fp / max(fp + tn, 1)),
            "false_negative_rate": float(fn / max(fn + tp, 1)),
            "true_positives": int(tp),
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
        }

    def decisions(self, scores: Iterable[float], threshold=.5) -> list[str]:
        return [decision(float(score), threshold) for score in scores]

    @staticmethod
    def _signal_strength(name: str, value: float) -> float:
        """Put heterogeneous telemetry onto a comparable 0..1 explanation scale."""
        v = float(value)
        if name in {"device_trust_score", "identity_consistency"}:
            return float(np.clip(1 - v, 0, 1))
        if name in {"amount", "amount_log", "amount_zscore"}:
            return float(np.tanh(max(v, 0) / 6))
        if name in {"velocity_1h", "velocity_24h"}:
            return float(np.tanh(max(v, 0) / 12))
        if name == "geo_distance_km":
            return float(np.tanh(max(v, 0) / 50))
        if name == "account_age_days":
            return float(np.clip(1 - v / 365, 0, 1))
        return float(np.clip(v, 0, 1))

    def explain(self, row, score: float, threshold: float = .5) -> dict:
        values = row.to_dict() if hasattr(row, "to_dict") else dict(row)
        contributions = []
        for name in self.feature_names:
            raw_value = float(values.get(name, 0.0))
            signal = self._signal_strength(name, raw_value)
            importance = float(self.feature_importance_.get(name, 0.0))
            contributions.append({
                "feature": name,
                "value": raw_value,
                "signal_strength": signal,
                "importance": importance,
                "contribution": signal * importance,
            })
        contributions.sort(key=lambda item: item["contribution"], reverse=True)
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
        model = joblib.load(path)
        if not isinstance(model, cls):
            raise TypeError("model artifact is not a MasterShield Detector")
        return model
