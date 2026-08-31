from __future__ import annotations

from dataclasses import dataclass
import hashlib
from itertools import product

from ..schemas import Attack


@dataclass(frozen=True)
class ThreatHypothesis:
    """A safe, non-operational research hypothesis for defensive simulation."""

    hypothesis_id: str
    name: str
    family: str
    payment_rail: str
    ai_capability: str
    stages: tuple[str, ...]
    observable_signals: tuple[str, ...]
    defense_hypothesis: str
    novelty_score: float


def _stable_id(text: str) -> str:
    return "DISC-" + hashlib.sha1(text.encode("utf-8")).hexdigest()[:10].upper()


def discover_hypotheses(attacks: list[Attack], limit: int = 20) -> list[ThreatHypothesis]:
    """Compose safe research hypotheses from existing catalog attributes.

    This produces abstract attack concepts for simulation and threat modeling. It does
    not provide exploit instructions, credentials, or operational attack procedures.
    """
    candidates: list[ThreatHypothesis] = []
    high_novelty = sorted(attacks, key=lambda item: item.novelty_score, reverse=True)[:20]
    rail_choices = sorted({rail for item in attacks for rail in item.payment_rails})
    ai_choices = sorted({cap for item in attacks for cap in item.ai_capabilities})

    stage_templates = [
        ("context", "payment", "Context precedes a payment anomaly."),
        ("identity", "payment", "Identity-state changes precede payment behavior."),
        ("account", "network", "Account activity links to a recipient network."),
        ("merchant", "refund", "Merchant-state anomalies precede a refund pattern."),
    ]

    for source, rail, ai in product(high_novelty[:8], rail_choices[:6], ai_choices[:6]):
        if len(candidates) >= limit:
            break
        template_index = (len(candidates) + len(source.id)) % len(stage_templates)
        first, second, defense = stage_templates[template_index]
        family = source.family
        signal_pool = tuple(dict.fromkeys(source.observable_signals))[:4]
        text = f"{source.name}|{rail}|{ai}|{first}|{second}"
        candidates.append(
            ThreatHypothesis(
                hypothesis_id=_stable_id(text),
                name=f"Composite {source.name} — {rail}",
                family=family,
                payment_rail=rail,
                ai_capability=ai,
                stages=(first, second),
                observable_signals=signal_pool,
                defense_hypothesis=defense,
                novelty_score=min(1.0, source.novelty_score + .04),
            )
        )
    return candidates
