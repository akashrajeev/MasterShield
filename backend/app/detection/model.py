from sklearn.ensemble import HistGradientBoostingClassifier, IsolationForest
from sklearn.metrics import precision_recall_fscore_support, roc_auc_score, confusion_matrix
from .thresholds import decision

class Detector:
    def __init__(self):
        self.classifier = HistGradientBoostingClassifier(max_iter=150, learning_rate=.08, max_leaf_nodes=31, random_state=42)
        self.anomaly = IsolationForest(n_estimators=150, contamination=.05, random_state=42)
        self.fitted = False

    def fit(self, X, y):
        self.classifier.fit(X, y)
        self.anomaly.fit(X)
        self.fitted = True
        return self

    def predict_scores(self, X):
        if not self.fitted:
            raise RuntimeError("Detector must be fitted before inference")
        supervised = self.classifier.predict_proba(X)[:, 1]
        anomaly = -self.anomaly.score_samples(X)
        anomaly = (anomaly - anomaly.min()) / (anomaly.max() - anomaly.min() + 1e-9)
        return .8 * supervised + .2 * anomaly

    def evaluate(self, X, y, threshold=.5):
        scores = self.predict_scores(X)
        pred = (scores >= threshold).astype(int)
        precision, recall, f1, _ = precision_recall_fscore_support(y, pred, average="binary", zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
        return {
            "precision": float(precision), "recall": float(recall), "f1": float(f1),
            "roc_auc": float(roc_auc_score(y, scores)),
            "false_positive_rate": float(fp / max(fp + tn, 1)),
            "false_negative_rate": float(fn / max(fn + tp, 1)),
        }

    def decisions(self, scores, threshold=.5):
        return [decision(float(s), threshold) for s in scores]
