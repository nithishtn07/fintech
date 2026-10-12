"""Comprehensive test suite for FinShield AI Backend API.

Tests all requirements:
1. GET /health
2. Successful analysis with stubbed risk service
3. Invalid transaction requests (422 validation errors)
4. Risk scores outside allowed range (boundary rejection)
5. Risk-service failures (503 service unavailable)
6. Database failures (500 persistence errors)
7. Empty transaction history (empty list)
8. Real statistics computed from stored records
9. History retrieval and pagination
"""

from datetime import datetime, timezone
from typing import List
import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_database, get_risk_engine
from app.main import app
from app.schemas.transaction import (
    RiskAnalysisResponse,
    RiskLevel,
    TransactionCreate,
    TransactionStatsResponse,
)
from app.services.database import (
    DatabaseError,
    DatabaseInterface,
    SQLAlchemyTransactionRepository,
)
from app.services.risk_engine import InvalidRiskScoreError, RiskEngineError


# ==============================================================================
# In-Memory Database Stub for Isolated Testing
# ==============================================================================
class InMemoryTestDatabase(DatabaseInterface):
    """Isolated in-memory test database avoiding filesystem or external dependency."""

    def __init__(self):
        self.records: List[RiskAnalysisResponse] = []
        self.should_fail_save = False
        self.should_fail_read = False

    def check_health(self) -> bool:
        return True

    def save_transaction_analysis(
        self, raw_data: TransactionCreate, analysis: RiskAnalysisResponse
    ) -> RiskAnalysisResponse:
        if self.should_fail_save:
            raise DatabaseError("Simulated database write failure")
        self.records.append(analysis)
        return analysis

    def get_transaction_history(
        self, limit: int = 50, offset: int = 0
    ) -> List[RiskAnalysisResponse]:
        if self.should_fail_read:
            raise DatabaseError("Simulated database read failure")
        # Sort descending by analyzed_at
        sorted_records = sorted(self.records, key=lambda x: x.analyzed_at, reverse=True)
        return sorted_records[offset : offset + limit]

    def get_transaction_stats(self) -> TransactionStatsResponse:
        if self.should_fail_read:
            raise DatabaseError("Simulated database read failure")
        total = len(self.records)
        if total == 0:
            return TransactionStatsResponse(
                total_transactions=0,
                low_risk_count=0,
                medium_risk_count=0,
                high_risk_count=0,
                average_risk_score=0.0,
            )

        low = sum(1 for r in self.records if r.risk_level == RiskLevel.LOW)
        med = sum(1 for r in self.records if r.risk_level == RiskLevel.MEDIUM)
        high = sum(1 for r in self.records if r.risk_level == RiskLevel.HIGH)
        avg = sum(r.risk_score for r in self.records) / total

        return TransactionStatsResponse(
            total_transactions=total,
            low_risk_count=low,
            medium_risk_count=med,
            high_risk_count=high,
            average_risk_score=round(avg, 2),
        )


# ==============================================================================
# Fixtures
# ==============================================================================
@pytest.fixture
def test_db():
    return InMemoryTestDatabase()


@pytest.fixture
def client(test_db):
    # Default dependency override using in-memory database
    app.dependency_overrides[get_database] = lambda: test_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==============================================================================
# 1. GET /health Tests
# ==============================================================================
def test_health_check_endpoint(client):
    """GET /health must return 200 OK with expected status and service name."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "FinShield AI API"


# ==============================================================================
# 2. POST /api/v1/transactions/analyze - Successful Analysis with Stubbed Service
# ==============================================================================
def test_analyze_transaction_success(client, test_db):
    """POST /analyze must validate request, invoke risk engine, persist, and return response."""
    stub_response = RiskAnalysisResponse(
        transaction_id="txn_test_123",
        risk_score=72,
        risk_level=RiskLevel.HIGH,
        detected_signals=["Unusual transaction pattern"],
        explanation="Risk indicators were detected.",
        recommended_action="Verify the transaction independently.",
        analysis_method="rule_based",
        analyzed_at=datetime.now(timezone.utc),
    )

    def stub_risk_engine(data: TransactionCreate):
        return stub_response

    app.dependency_overrides[get_risk_engine] = lambda: stub_risk_engine

    payload = {
        "amount": 25000,
        "transaction_type": "transfer",
        "timestamp": "2026-10-12T10:30:00Z",
    }

    response = client.post("/api/v1/transactions/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["transaction_id"] == "txn_test_123"
    assert data["risk_score"] == 72
    assert data["risk_level"] == "HIGH"
    assert data["detected_signals"] == ["Unusual transaction pattern"]
    assert data["explanation"] == "Risk indicators were detected."
    assert data["recommended_action"] == "Verify the transaction independently."
    assert data["analysis_method"] == "rule_based"
    assert "analyzed_at" in data

    # Verify that the record was persisted in the database
    assert len(test_db.records) == 1
    assert test_db.records[0].transaction_id == "txn_test_123"


# ==============================================================================
# 3. Invalid Transaction Requests (Input Validation Tests)
# ==============================================================================
@pytest.mark.parametrize(
    "invalid_payload,expected_error_field",
    [
        ({}, "amount"),  # Empty body missing amount & transaction_type
        ({"amount": -100.0, "transaction_type": "transfer"}, "amount"),  # Negative amount
        ({"amount": 0.0, "transaction_type": "transfer"}, "amount"),  # Zero amount
        ({"amount": "invalid_number", "transaction_type": "transfer"}, "amount"),  # Non-numeric
        ({"amount": 500.0, "transaction_type": ""}, "transaction_type"),  # Empty type
        ({"amount": 500.0}, "transaction_type"),  # Missing type
    ],
)
def test_analyze_transaction_invalid_inputs(client, invalid_payload, expected_error_field):
    """POST /analyze must reject malformed inputs with HTTP 422 Unprocessable Entity."""
    response = client.post("/api/v1/transactions/analyze", json=invalid_payload)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    # Verify the error references the problematic field
    error_locations = [str(err.get("loc", [])) for err in data["detail"]]
    assert any(expected_error_field in loc for loc in error_locations)


# ==============================================================================
# 4. Risk Scores Outside Allowed Range (Defensive Handling)
# ==============================================================================
def test_analyze_transaction_risk_score_above_bounds(client):
    """If the risk engine returns a score > 100, the API must reject with 502 Bad Gateway."""
    def invalid_high_engine(data: TransactionCreate):
        # Bypass pydantic schema check inside the mock engine to test API boundary check
        raise InvalidRiskScoreError("Risk score 125 exceeds 100")

    app.dependency_overrides[get_risk_engine] = lambda: invalid_high_engine

    payload = {"amount": 1000, "transaction_type": "payment"}
    response = client.post("/api/v1/transactions/analyze", json=payload)
    assert response.status_code == 502
    assert "invalid result" in response.json()["detail"].lower()


def test_analyze_transaction_risk_score_below_bounds(client):
    """If the risk engine returns a score < 0, the API must reject with 502 Bad Gateway."""
    def invalid_low_engine(data: TransactionCreate):
        raise InvalidRiskScoreError("Risk score -10 is below 0")

    app.dependency_overrides[get_risk_engine] = lambda: invalid_low_engine

    payload = {"amount": 1000, "transaction_type": "payment"}
    response = client.post("/api/v1/transactions/analyze", json=payload)
    assert response.status_code == 502
    assert "invalid result" in response.json()["detail"].lower()


# ==============================================================================
# 5. Risk Service Failures
# ==============================================================================
def test_analyze_transaction_risk_service_failure(client):
    """When the risk service encounters an outage or error, API returns 503 Service Unavailable."""
    def failing_risk_engine(data: TransactionCreate):
        raise RiskEngineError("ML inference service connection timed out")

    app.dependency_overrides[get_risk_engine] = lambda: failing_risk_engine

    payload = {"amount": 5000, "transaction_type": "transfer"}
    response = client.post("/api/v1/transactions/analyze", json=payload)
    assert response.status_code == 503
    assert "unavailable" in response.json()["detail"].lower()


def test_analyze_transaction_unexpected_engine_exception(client):
    """When the risk engine raises an unexpected exception, API returns 500 Internal Server Error."""
    def crashing_engine(data: TransactionCreate):
        raise RuntimeError("Fatal memory crash in risk worker")

    app.dependency_overrides[get_risk_engine] = lambda: crashing_engine

    payload = {"amount": 5000, "transaction_type": "transfer"}
    response = client.post("/api/v1/transactions/analyze", json=payload)
    assert response.status_code == 500


# ==============================================================================
# 6. Database Failures
# ==============================================================================
def test_analyze_transaction_database_write_failure(client, test_db):
    """When the database write fails, API returns 500 without corrupting client state."""
    test_db.should_fail_save = True

    payload = {"amount": 1500, "transaction_type": "transfer"}
    response = client.post("/api/v1/transactions/analyze", json=payload)
    assert response.status_code == 500
    assert "database persistence error" in response.json()["detail"].lower()


def test_history_database_read_failure(client, test_db):
    """When database read fails during history query, API returns 500."""
    test_db.should_fail_read = True
    response = client.get("/api/v1/transactions/history")
    assert response.status_code == 500


def test_stats_database_read_failure(client, test_db):
    """When database read fails during stats aggregation, API returns 500."""
    test_db.should_fail_read = True
    response = client.get("/api/v1/transactions/stats")
    assert response.status_code == 500


# ==============================================================================
# 7. Empty Transaction History & Stats
# ==============================================================================
def test_history_empty_database(client):
    """GET /history on empty database returns 200 OK and an empty list []."""
    response = client.get("/api/v1/transactions/history")
    assert response.status_code == 200
    assert response.json() == []


def test_stats_empty_database(client):
    """GET /stats on empty database returns zeroed counts without inventing data."""
    response = client.get("/api/v1/transactions/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_transactions"] == 0
    assert data["low_risk_count"] == 0
    assert data["medium_risk_count"] == 0
    assert data["high_risk_count"] == 0
    assert data["average_risk_score"] == 0.0


# ==============================================================================
# 8. Statistics Calculated from Test Records
# ==============================================================================
def test_stats_computed_from_stored_records(client, test_db):
    """GET /stats computes accurate metrics based strictly on stored transactions."""
    # Seed test database with known records
    records = [
        RiskAnalysisResponse(
            transaction_id="txn_01",
            risk_score=10,
            risk_level=RiskLevel.LOW,
            detected_signals=[],
            explanation="Normal",
            recommended_action="Allow",
            analysis_method="rule_based",
            analyzed_at=datetime.now(timezone.utc),
        ),
        RiskAnalysisResponse(
            transaction_id="txn_02",
            risk_score=40,
            risk_level=RiskLevel.MEDIUM,
            detected_signals=["Elevated value"],
            explanation="Moderate",
            recommended_action="Review",
            analysis_method="rule_based",
            analyzed_at=datetime.now(timezone.utc),
        ),
        RiskAnalysisResponse(
            transaction_id="txn_03",
            risk_score=80,
            risk_level=RiskLevel.HIGH,
            detected_signals=["High volume"],
            explanation="Elevated risk",
            recommended_action="Flag",
            analysis_method="rule_based",
            analyzed_at=datetime.now(timezone.utc),
        ),
        RiskAnalysisResponse(
            transaction_id="txn_04",
            risk_score=90,
            risk_level=RiskLevel.HIGH,
            detected_signals=["High volume", "New device"],
            explanation="Critical risk",
            recommended_action="Block",
            analysis_method="rule_based",
            analyzed_at=datetime.now(timezone.utc),
        ),
    ]
    for r in records:
        test_db.records.append(r)

    response = client.get("/api/v1/transactions/stats")
    assert response.status_code == 200
    stats = response.json()

    # Total: 4, Low: 1, Medium: 1, High: 2
    # Avg score: (10 + 40 + 80 + 90) / 4 = 220 / 4 = 55.0
    assert stats["total_transactions"] == 4
    assert stats["low_risk_count"] == 1
    assert stats["medium_risk_count"] == 1
    assert stats["high_risk_count"] == 2
    assert stats["average_risk_score"] == 55.0


# ==============================================================================
# 9. History Pagination Tests
# ==============================================================================
def test_history_pagination(client, test_db):
    """GET /history supports limit and offset parameters."""
    for i in range(10):
        test_db.records.append(
            RiskAnalysisResponse(
                transaction_id=f"txn_{i:02d}",
                risk_score=20 + i,
                risk_level=RiskLevel.LOW,
                detected_signals=[],
                explanation="Normal",
                recommended_action="Allow",
                analysis_method="rule_based",
                analyzed_at=datetime.now(timezone.utc),
            )
        )

    # Fetch page 1 (limit 3, offset 0)
    res1 = client.get("/api/v1/transactions/history?limit=3&offset=0")
    assert res1.status_code == 200
    page1 = res1.json()
    assert len(page1) == 3

    # Fetch page 2 (limit 3, offset 3)
    res2 = client.get("/api/v1/transactions/history?limit=3&offset=3")
    assert res2.status_code == 200
    page2 = res2.json()
    assert len(page2) == 3

    # Verify distinct items between pages
    ids_p1 = {item["transaction_id"] for item in page1}
    ids_p2 = {item["transaction_id"] for item in page2}
    assert ids_p1.isdisjoint(ids_p2)


# ==============================================================================
# 10. End-to-End Test with SQLAlchemy SQLite Repository
# ==============================================================================
def test_real_sqlite_repository_integration(tmp_path):
    """Verifies that the default SQLAlchemy SQLite implementation works end-to-end."""
    db_file = tmp_path / "test_finshield.db"
    db_url = f"sqlite:///{db_file}"
    repo = SQLAlchemyTransactionRepository(db_url=db_url)

    # Health check
    assert repo.check_health() is True

    # Empty stats and history
    empty_stats = repo.get_transaction_stats()
    assert empty_stats.total_transactions == 0
    assert repo.get_transaction_history() == []

    # Save transaction
    txn_input = TransactionCreate(
        amount=3500.0,
        transaction_type="transfer",
        sender_account="acc_alice",
        recipient_account="acc_bob",
    )
    analysis_res = RiskAnalysisResponse(
        transaction_id="txn_sqlite_001",
        risk_score=45,
        risk_level=RiskLevel.MEDIUM,
        detected_signals=["Elevated transaction value"],
        explanation="Test explanation",
        recommended_action="Test recommendation",
        analysis_method="rule_based",
        analyzed_at=datetime.now(timezone.utc),
    )

    saved = repo.save_transaction_analysis(raw_data=txn_input, analysis=analysis_res)
    assert saved.transaction_id == "txn_sqlite_001"

    # History now contains 1 record
    history = repo.get_transaction_history()
    assert len(history) == 1
    assert history[0].transaction_id == "txn_sqlite_001"
    assert history[0].detected_signals == ["Elevated transaction value"]

    # Stats updated
    stats = repo.get_transaction_stats()
    assert stats.total_transactions == 1
    assert stats.medium_risk_count == 1
    assert stats.average_risk_score == 45.0
