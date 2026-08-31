from __future__ import annotations
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier, IsolationForest
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support, roc_auc_score

class DetectorV2:
    """Reproducible two-signal detector: supervised fraud probability + anomaly score."""
    version="0.2.0"

    def __init__(self, anomaly_weight: float=.20):
        self.classifier=HistGradientBoostingClassifier(max_iter=180,learning_rate=.07,max_leaf_nodes=31,l2_regularization=.15,random_state=42)
        self.anomaly=IsolationForest(n_estimators=200,contamination=.05,random_state=42)
        self.anomaly_weight=float(anomaly_weight); self.anomaly_min=0.0; self.anomaly_max=1.0; self.fitted=False

    def fit(self,X,y):
        self.classifier.fit(X,y)
        self.anomaly.fit(X)
        raw=-self.anomaly.score_samples(X)
        self.anomaly_min=float(raw.min()); self.anomaly_max=float(raw.max())
        self.fitted=True
        return self

    def predict_scores(self,X):
        if not self.fitted: raise RuntimeError("Detector must be fitted before inference")
        supervised=self.classifier.predict_proba(X)[:,1]
        raw=-self.anomaly.score_samples(X)
        anomaly=np.clip((raw-self.anomaly_min)/(self.anomaly_max-self.anomaly_min+1e-9),0,1)
        return (1-self.anomaly_weight)*supervised+self.anomaly_weight*anomaly

    def evaluate(self,X,y,threshold=.5):
        scores=self.predict_scores(X); pred=(scores>=threshold).astype(int)
        precision,recall,f1,_=precision_recall_fscore_support(y,pred,average="binary",zero_division=0)
        tn,fp,fn,tp=confusion_matrix(y,pred,labels=[0,1]).ravel()
        return {"precision":float(precision),"recall":float(recall),"f1":float(f1),"roc_auc":float(roc_auc_score(y,scores)) if len(np.unique(y))>1 else 0.0,"false_positive_rate":float(fp/max(fp+tn,1)),"false_negative_rate":float(fn/max(fn+tp,1)),"true_positives":int(tp),"true_negatives":int(tn),"false_positives":int(fp),"false_negatives":int(fn)}
