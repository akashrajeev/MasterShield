from backend.app.identify.catalog import load_attacks

def test_attack_catalog_is_large_and_structured():
    attacks=load_attacks()
    assert len(attacks) >= 120
    assert len({a.id for a in attacks}) == len(attacks)
    assert all(a.generator_id for a in attacks)
    assert len({a.family for a in attacks}) >= 6
