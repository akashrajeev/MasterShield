from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field

Difficulty = Literal["low", "medium", "high", "very-high"]


class Attack(BaseModel):
    id: str
    name: str
    family: str
    description: str
    severity: Literal["low", "medium", "high", "critical"]
    difficulty: Difficulty
    payment_rails: list[str]
    ai_capabilities: list[str]
    observable_signals: list[str]
    defenses: list[str]
    novelty_score: float = Field(ge=0, le=1)
    evidence_status: str = "synthetic-composite"
    generator_id: str


class SimulationConfig(BaseModel):
    events: int = Field(default=1000, ge=100, le=1_000_000)
    seed: int = Field(default=829134, ge=0)
    attack_ids: list[str] | None = None
    fraud_rate: float = Field(default=0.12, ge=0.01, le=0.5)
    difficulty: Difficulty = "high"
    adaptation: Literal["static", "adaptive", "adversarial"] = "static"
    noise: Literal["low", "medium", "high"] = "medium"
    threshold: float = Field(default=.5, ge=0.05, le=.95)


class DetectionRequest(SimulationConfig):
    model_path: str | None = None


class DetectionResult(BaseModel):
    risk_score: float
    decision: Literal["ALLOW", "MONITOR", "STEP_UP", "BLOCK_REVIEW"]
    prediction: int
    top_signals: list[dict[str, Any]]
