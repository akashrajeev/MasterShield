from backend.app.identify.novelty import novelty_band, recompute_novelty

def test_novelty_band_boundaries():
    assert novelty_band(.2)=="established"
    assert novelty_band(.55)=="emerging"
    assert novelty_band(.75)=="novel"
    assert novelty_band(.9)=="highly-novel"

def test_novelty_score_is_bounded():
    score=recompute_novelty(4,4,4,True,"synthetic-composite")
    assert 0 <= score <= 1
