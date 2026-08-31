from __future__ import annotations
from backend.app.identify.catalog import load_attacks

GENERATOR_FAMILIES={
    "identity":"identity",
    "social-engineering":"social",
    "account-takeover":"ato",
    "merchant":"merchant",
    "transaction-evasion":"transaction",
    "mule-aml":"aml",
    "payment-instrument":"instrument",
    "api-abuse":"api-abuse",
    "behavioral":"behavioral",
    "cross-channel":"cross-channel",
    "autonomous":"autonomous",
    "synthetic-content":"synthetic-content",
}

def generator_for_attack(attack_id:str)->str:
    attack=next((a for a in load_attacks() if a.id.lower()==attack_id.lower()),None)
    if attack is None: return "unknown"
    return attack.generator_id or GENERATOR_FAMILIES.get(attack.family,attack.family)


def catalog_summary()->dict:
    attacks=load_attacks()
    return {"attacks":len(attacks),"families":{f:sum(a.family==f for a in attacks) for f in sorted({a.family for a in attacks})},"generators":sorted({a.generator_id for a in attacks})}
