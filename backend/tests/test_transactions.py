"""Tests for transaction analysis, validation, persistence, history, and statistics."""
import pytest
from app.db.models import TransactionModel


def test_analyze_valid_low_risk_transaction(client):
    """Verify valid daylight low-amount transaction yields LOW risk assessment."""
    payload = {
        "amount": 450.0,
        "currency": "INR",
        "transaction_type": "MERCHANT",
        "payment_method": "UPI",
        "transaction_hour": 15,
        "velocity_1h": 1,
        "velocity_24h": 2,
        "recipient_id": "REC-GROCERY-01",
        "is_new_recipient": False
    }
    response = client.post("/api/v1/transactions/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "transaction_id" in data
    assert data["transaction_id"].startswith("TXN-")
    assert 0 <= data["risk_score"] <= 100
    assert data["risk_level"] == "LOW"
    assert data["recommended_action"] == "ALLOW"
    assert data["analysis_method"] == "RULE_BASED_BASELINE"
    assert "analyzed_at" in data
    assert isinstance(data["detected_signals"], list)
    assert "explanation" in data


def test_analyze_high_risk_transaction(client):
    """Verify late-night high-value transfer to new recipient triggers HIGH risk."""
    payload = {
        "amount": 180000.0,
        "currency": "INR",
        "transaction_type": "P2P",
        "payment_method": "UPI",
        "transaction_hour": 3,
        "velocity_1h": 6,
        "velocity_24h": 15,
        "recipient_id": "REC-SUSPECT-99",
        "is_new_recipient": True
    }
    response = client.post("/api/v1/transactions/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["risk_score"] <= 100
    assert data["risk_level"] == "HIGH"
    assert data["recommended_action"] == "HOLD_FOR_REVIEW"
    assert len(data["detected_signals"]) > 0
    assert "COMPOUND_HIGH_RISK_PROFILE" in data["detected_signals"]


def test_risk_score_bounds_and_levels(client):
    """Verify risk scores always stay strictly within [0, 100] and risk levels are valid."""
    test_cases = [
        {"amount": 10.0, "transaction_type": "P2P", "payment_method": "UPI"},
        {"amount": 49500.0, "transaction_type": "P2P", "payment_method": "UPI", "is_new_recipient": True},
        {"amount": 500000.0, "transaction_type": "P2P", "payment_method": "UPI", "velocity_1h": 8, "transaction_hour": 2, "is_new_recipient": True},
    ]
    for case in test_cases:
        res = client.post("/api/v1/transactions/analyze", json=case)
        assert res.status_code == 200
        data = res.json()
        assert 0.0 <= data["risk_score"] <= 100.0
        assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]


def test_reject_negative_amount(client):
    """Verify negative transaction amount is rejected with 422."""
    payload = {
        "amount": -500.0,
        "currency": "INR",
        "transaction_type": "P2P",
        "payment_method": "UPI"
    }
    response = client.post("/api/v1/transactions/analyze", json=payload)
    assert response.status_code == 422


def test_reject_zero_amount(client):
    """Verify zero transaction amount is rejected with 422."""
    payload = {
        "amount": 0.0,
        "currency": "INR",
        "transaction_type": "P2P",
        "payment_method": "UPI"
    }
    response = client.post("/api/v1/transactions/analyze", json=payload)
    assert response.status_code == 422


def test_reject_missing_required_fields(client):
    """Verify missing required fields triggers 422 validation error."""
    # Missing amount
    res1 = client.post("/api/v1/transactions/analyze", json={"transaction_type": "P2P", "payment_method": "UPI"})
    assert res1.status_code == 422

    # Missing transaction_type
    res2 = client.post("/api/v1/transactions/analyze", json={"amount": 1000.0, "payment_method": "UPI"})
    assert res2.status_code == 422

    # Missing payment_method
    res3 = client.post("/api/v1/transactions/analyze", json={"amount": 1000.0, "transaction_type": "P2P"})
    assert res3.status_code == 422


def test_database_persistence(client, db_session):
    """Verify transaction analysis persists correctly to SQLite."""
    payload = {
        "amount": 1250.0,
        "currency": "INR",
        "transaction_type": "BILL_PAYMENT",
        "payment_method": "NET_BANKING",
        "transaction_hour": 14,
        "recipient_id": "REC-ELECTRICITY-BOARD",
    }
    res = client.post("/api/v1/transactions/analyze", json=payload)
    assert res.status_code == 200
    txn_id = res.json()["transaction_id"]

    # Verify directly in SQLite test session
    record = db_session.query(TransactionModel).filter(TransactionModel.transaction_id == txn_id).first()
    assert record is not None
    assert record.amount == 1250.0
    assert record.currency == "INR"
    assert record.transaction_type == "BILL_PAYMENT"
    assert record.payment_method == "NET_BANKING"
    assert record.recipient_id == "REC-ELECTRICITY-BOARD"
    assert record.risk_level == "LOW"


def test_transaction_history_retrieval(client):
    """Verify transaction history endpoint returns items ordered newest first."""
    # Insert two transactions
    t1 = client.post("/api/v1/transactions/analyze", json={
        "amount": 300.0,
        "transaction_type": "MERCHANT",
        "payment_method": "UPI",
    }).json()

    t2 = client.post("/api/v1/transactions/analyze", json={
        "amount": 1500.0,
        "transaction_type": "MERCHANT",
        "payment_method": "UPI",
    }).json()

    res = client.get("/api/v1/transactions/history?limit=10")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) >= 2
    # Verify newest first
    assert items[0]["transaction_id"] == t2["transaction_id"]
    assert items[1]["transaction_id"] == t1["transaction_id"]


def test_transaction_stats_calculation(client):
    """Verify aggregated stats calculate dynamically and accurately from stored records."""
    # Add a LOW risk txn
    client.post("/api/v1/transactions/analyze", json={
        "amount": 200.0,
        "transaction_type": "MERCHANT",
        "payment_method": "UPI",
        "transaction_hour": 14,
    })

    # Add a HIGH risk txn
    client.post("/api/v1/transactions/analyze", json={
        "amount": 200000.0,
        "transaction_type": "P2P",
        "payment_method": "UPI",
        "transaction_hour": 3,
        "velocity_1h": 7,
        "is_new_recipient": True,
    })

    stats_res = client.get("/api/v1/transactions/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_transactions"] == 2
    assert stats["low_risk_count"] == 1
    assert stats["high_risk_count"] == 1
    assert stats["medium_risk_count"] == 0
    assert stats["low_risk_percentage"] == 50.0
    assert stats["high_risk_percentage"] == 50.0
    assert stats["total_volume_inr"] == 200200.0
    assert stats["average_risk_score"] > 0
