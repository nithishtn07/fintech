"""Tests for health check endpoints."""


def test_health_check_root(client):
    """Verify root /health endpoint returns application name, status, and metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["application_name"] == "FinShield AI"
    assert data["status"] == "healthy"
    assert "FinShield AI" in data["message"]
    assert "version" in data


def test_health_check_v1(client):
    """Verify /api/v1/health endpoint returns successful status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["application_name"] == "FinShield AI"
    assert data["status"] == "healthy"


def test_root_index(client):
    """Verify / index route returns API metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "FinShield AI"
    assert data["docs_url"] == "/docs"
