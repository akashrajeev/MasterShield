from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score

def binary_metrics(y_true, scores, threshold=.5):
    pred = (scores >= threshold).astype(int)
    return {
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred, zero_division=0)),
        "f1": float(f1_score(y_true, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, scores)),
    }
