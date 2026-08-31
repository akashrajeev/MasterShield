from pathlib import Path
import json
from ..schemas import Attack

DATA = Path(__file__).resolve().parents[2] / "../data/attacks/attacks.json"


def load_attacks() -> list[Attack]:
    with open(DATA.resolve(), encoding="utf-8") as f:
        return [Attack.model_validate(x) for x in json.load(f)]


def get_attack(attack_id: str) -> Attack | None:
    return next((a for a in load_attacks() if a.id == attack_id), None)
