from __future__ import annotations
import numpy as np
from sklearn.metrics import confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score

def binary_metrics(y_true, scores, threshold: float = 0.5) -> dict:
    y=np.asarray(y_true).astype(int); s=np.asarray(scores); p=(s>=threshold).astype(int)
    tn,fp,fn,tp=confusion_matrix(y,p,labels=[0,1]).ravel()
    return {"precision":float(precision_score(y,p,zero_division=0)),"recall":float(recall_score(y,p,zero_division=0)),"f1":float(f1_score(y,p,zero_division=0)),"roc_auc":float(roc_auc_score(y,s)) if len(np.unique(y))>1 else 0.0,"false_positive_rate":float(fp/max(fp+tn,1)),"false_negative_rate":float(fn/max(fn+tp,1)),"true_positives":int(tp),"true_negatives":int(tn),"false_positives":int(fp),"false_negatives":int(fn)}

def metrics_by_group(df, scores, group_col: str, threshold: float=0.5) -> dict:
    out={}
    for key, idx in df.groupby(group_col).groups.items():
        i=np.asarray(list(idx), dtype=int)
        out[str(key)] = binary_metrics(df.iloc[i]["ground_truth"], np.asarray(scores)[i], threshold)
    return out
