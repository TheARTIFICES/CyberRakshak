import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel
import uuid
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from app.database import engine

# Initialize database schema for test runner
SQLModel.metadata.create_all(engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_risk_exposure_endpoint():
    response = client.get("/api/risk/exposure")
    assert response.status_code == 200
    data = response.json()
    assert "expected_annual_loss_inr" in data
    assert "enterprise_risk_score" in data
    assert data["currency"] == "INR"

def test_investment_optimizer_endpoint():
    payload = {
        "budget_inr": 500000.0
    }
    response = client.post("/api/investment/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "selected_actions" in data
    assert "total_cost_inr" in data
    assert data["total_cost_inr"] <= 500000.0

def test_pareto_spend_curve_endpoint():
    response = client.get("/api/investment/pareto?max_budget_inr=1500000.0")
    assert response.status_code == 200
    data = response.json()
    assert "curve_points" in data
    assert len(data["curve_points"]) == 10
    assert "knee_point" in data

def test_scenario_simulation_endpoint():
    # 1. Get scenarios catalog
    scenarios_resp = client.get("/api/simulation/scenarios")
    assert scenarios_resp.status_code == 200
    scenarios = scenarios_resp.json()
    assert len(scenarios) >= 4

    # 2. Run simulation
    sim_payload = {
        "scenario_id": "MFA_EVERYWHERE"
    }
    run_resp = client.post("/api/simulation/run", json=sim_payload)
    assert run_resp.status_code == 200
    sim_data = run_resp.json()
    assert "baseline" in sim_data
    assert "projected" in sim_data
    assert "impact" in sim_data

def test_compliance_scores_endpoint():
    response = client.get("/api/compliance/scores")
    assert response.status_code == 200
    scores = response.json()
    assert len(scores) == 6 # 6 frameworks
    framework_names = [s["framework_name"] for s in scores]
    assert "DPDP_2023" in framework_names
    assert "SEBI_CSCRF" in framework_names
    assert "RBI_CSF" in framework_names

def test_connector_trigger_and_allowlist():
    # 1. Valid connector
    resp_valid = client.post("/api/connectors/trigger/azure_ad")
    assert resp_valid.status_code == 200
    assert resp_valid.json()["status"] == "success"

    # 2. Unauthorized connector rejected with 400
    resp_invalid = client.post("/api/connectors/trigger/malicious_connector")
    assert resp_invalid.status_code == 400
