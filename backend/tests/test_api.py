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
    assert len(payload["generators"]["generators"]) >= 8


def test_discovery_endpoint():
    response = client.get("/api/catalog/discover?limit=8")
    assert response.status_code == 200
    payload = response.json()
    assert 1 <= payload["count"] <= 8
    assert payload["safe_simulation_only"] is True


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
    for key in ["precision", "recall", "f1", "roc_auc", "pr_auc", "false_positive_rate", "false_negative_rate"]:
        assert 0 <= metrics[key] <= 1
    assert len(detected.json()["thresholds"]) > 0


def test_prediction_endpoint():
    payload = {
        "events": [
            {
                "transaction_id": "SMOKE_1",
                "amount": 1200,
                "amount_zscore": .2,
                "velocity_1h": 1,
                "velocity_24h": 3,
                "geo_distance_km": 2.0,
                "beneficiary_age_days": 200,
                "device_trust_score": .92,
                "behavioral_deviation": .08,
                "merchant_risk": .10,
                "account_age_days": 500,
                "normal_daily_txns": 6,
                "network_risk": .03,
                "device_reuse_score": 0,
                "beneficiary_fanout_score": 0,
                "account_beneficiary_degree": 1,
                "beneficiary_account_degree": 1,
                "account_outflow": 1200,
                "beneficiary_inflow": 1200,
                "account_to_beneficiary_share": 1,
                "beneficiary_amount_share": 1,
                "counterparty_count": 1,
                "network_amount_concentration": 1,
                "urgency_score": .05,
                "approval_path_change": 0,
                "content_risk": .04,
                "cross_rail_activity": 0,
                "identity_consistency": .95,
                "scenario_stage": 0,
            }
        ],
        "threshold": .5,
        "seed": 1234,
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["count"] == 1
    assert 0 <= result["results"][0]["risk_score"] <= 1
    assert result["results"][0]["decision"] in {"ALLOW", "MONITOR", "STEP_UP", "BLOCK_REVIEW"}
