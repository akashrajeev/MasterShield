from __future__ import annotations
import numpy as np
import pandas as pd


def compose_cross_channel(df: pd.DataFrame, seed: int, stages: list[str]) -> pd.DataFrame:
    """Attach a synthetic multi-stage campaign to a fraction of events."""
    rng=np.random.default_rng(seed)
    out=df.copy()
    out["scenario_id"]=None
    out["stage_index"]=0
    out["scenario_stage"]="baseline"
    fraud_idx=np.flatnonzero(out["ground_truth"].to_numpy()==1)
    if not len(fraud_idx): return out
    groups=np.array_split(fraud_idx,max(1,min(len(fraud_idx)//max(len(stages),1),25)))
    for g_idx,group in enumerate(groups):
        scenario=f"SCN_{seed}_{g_idx:04d}"
        ordered=group[:len(stages)]
        rng.shuffle(ordered)
        for stage_idx,row_idx in enumerate(ordered):
            out.loc[row_idx,"scenario_id"]=scenario
            out.loc[row_idx,"stage_index"]=stage_idx+1
            out.loc[row_idx,"scenario_stage"]=stages[stage_idx]
    return out


def scenario_summary(df: pd.DataFrame)->dict:
    campaigns=int(df["scenario_id"].dropna().nunique()) if "scenario_id" in df else 0
    return {"campaigns":campaigns,"multi_stage_events":int((df.get("stage_index",pd.Series(0,index=df.index))>1).sum())}
