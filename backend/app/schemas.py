from typing import Any, Literal
from pydantic import BaseModel, Field

class Attack(BaseModel):
    id: str
    name: str
    family: str
    description: str
    severity: Literal["low", "medium", "high", "critical"]
    difficulty: Literal["low", "medium", "high", "very-high"]
    payment_rails: list[str]
    ai_capabilities: list[str]
    observable_signals: list[str]
    defenses: list[str]
    novelty_score: float = Field(ge=0, le=1)
    evidence_status: str = "synthetic-composite"
    generator_id: str

class SimulationConfig(BaseModel):
    events: int = Field(default=1000, ge=100, le=1_000_000)
    seed: int = 829134
    attack_ids: list[str] | None = None
    fraud_rate: float = Field(default=0.12, ge=0.01, le=0.5)
    difficulty: str = "high"

class DetectionResult(BaseModel):
    risk_score: float
    decision: Literal["ALLOW", "MONITOR", "STEP_UP", "BLOCK_REVIEW"]
    prediction: int
    top_signals: list[dict[str, Any]]
