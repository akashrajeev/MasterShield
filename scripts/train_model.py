from backend.app.generators.transaction import generate_transactions
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector

if __name__ == '__main__':
    df = generate_transactions(20000, 829134)
    X = build_features(df)
    detector = Detector().fit(X, df.ground_truth)
    print(detector.evaluate(X, df.ground_truth))
