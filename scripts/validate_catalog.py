from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from backend.app.identify.catalog import load_attacks


def main() -> None:
    attacks = load_attacks()
    families = Counter(a.family for a in attacks)
    generators = Counter(a.generator_id for a in attacks)
    rails = Counter(rail for a in attacks for rail in a.payment_rails)
    errors = []
    seen = set()
    for attack in attacks:
        if attack.id in seen:
            errors.append(f"duplicate id: {attack.id}")
        seen.add(attack.id)
        if not attack.payment_rails:
            errors.append(f"missing rails: {attack.id}")
        if not attack.generator_id:
            errors.append(f"missing generator: {attack.id}")
    report = {
        "attack_count": len(attacks),
        "family_count": len(families),
        "families": dict(families),
        "generators": dict(generators),
        "payment_rails": dict(rails),
        "very_high_count": sum(a.difficulty == "very-high" for a in attacks),
        "critical_count": sum(a.severity == "critical" for a in attacks),
        "average_novelty": round(sum(a.novelty_score for a in attacks) / max(len(attacks), 1), 4),
        "errors": errors,
    }
    Path("ml/results").mkdir(parents=True, exist_ok=True)
    Path("ml/results/catalog_validation.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    if len(attacks) < 120 or len(families) < 10 or errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
