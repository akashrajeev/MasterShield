from __future__ import annotations
import numpy as np
from .metrics_v2 import binary_metrics

def grouped_metrics(df, scores, group_col: str, threshold: float=.5):
    scores=np.asarray(scores)
    out={}
    for key, indexes in df.groupby(group_col).groups.items():
        idx=np.asarray(list(indexes),dtype=int)
        out[str(key)] = binary_metrics(df.iloc[idx]["ground_truth"],scores[idx],threshold)
    return out
