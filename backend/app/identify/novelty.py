from __future__ import annotations

def novelty_band(score: float) -> str:
    if score < .40: return "established"
    if score < .70: return "emerging"
    if score < .85: return "novel"
    return "highly-novel"

def recompute_novelty(ai_capabilities:int, rail_count:int, stage_count:int, adaptive:bool, evidence_status:str)->float:
    # Transparent research heuristic used for prioritization; it is not a claim of scientific novelty.
    score=.15*min(ai_capabilities/4,1)+.15*min(rail_count/4,1)+.25*min(stage_count/4,1)+(.25 if adaptive else .08)
    score += {"documented":.03,"emerging":.08,"research":.12,"hypothetical":.10,"synthetic-composite":.15}.get(evidence_status,.10)
    return max(0.0,min(1.0,score))
