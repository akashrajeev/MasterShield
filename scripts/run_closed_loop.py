from backend.app.generators.transaction import generate_transactions
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector
from backend.app.adversarial.mutation import mutate

if __name__ == '__main__':
    base = generate_transactions(10000, 829134)
    X = build_features(base)
    detector = Detector().fit(X, base.ground_truth)
    print('round_1', detector.evaluate(X, base.ground_truth))
    hard = mutate(base[base.ground_truth == 1], 829135, .35)
    hx = build_features(hard)
    scores = detector.predict_scores(hx)
    print('hard_variants_mean_risk', float(scores.mean()))
