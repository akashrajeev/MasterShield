from __future__ import annotations
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any
import json
from pathlib import Path

@dataclass
class Experiment:
    experiment_id: str
    model_version: str
    seed: int
    events: int
    attack_ids: list[str]
    threshold: float
    metrics: dict[str, Any]

    def save_json(self, path: str|Path="ml/results/experiments.jsonl") -> None:
        p=Path(path); p.parent.mkdir(parents=True,exist_ok=True)
        row={**asdict(self),"created_at":datetime.now(timezone.utc).isoformat()}
        with p.open("a",encoding="utf-8") as f: f.write(json.dumps(row)+"\n")
