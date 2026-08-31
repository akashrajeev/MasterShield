from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_catalog_summary():
    response = client.get("/api/catalog/summary")
    assert response.status_code == 200
    payload = response.json()
    assert payload["attack_count"] >= 120
    assert payload["family_count"] >= 10


def test_simulate_and_detect():
    payload = {
        "events": 600,
        "seed": 123456,
        "fraud_rate": 0.15,
        "difficulty": "high",
        "attack_ids": None,
        "adaptation": "static",
        "noise": "medium",
        "threshold": 0.5,
    }
    simulated = client.post("/api/simulate", json=payload)
    assert simulated.status_code == 200
    assert simulated.json()["events_generated"] == 600

    detected = client.post("/api/detect", json=payload)
    assert detected.status_code == 200
    metrics = detected.json()["metrics"]
    assert 0 <= metrics["f1"] <= 1
    assert len(detected.json()["thresholds"]) > 0
