def decision(score: float, threshold: float = .5) -> str:
    if score < threshold * .55:
        return "ALLOW"
    if score < threshold:
        return "MONITOR"
    if score < min(threshold + .2, .9):
        return "STEP_UP"
    return "BLOCK_REVIEW"
