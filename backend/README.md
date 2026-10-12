# FinShield AI — Backend API Documentation

**Author:** Member 2 (Backend API Developer)  
**Hackathon Phase:** Phase 1 — Backend API Development  
**Branch:** `feature/backend-api`

---

## 1. Overview

The FinShield AI Backend is built with **FastAPI** to serve as the high-performance central gateway connecting:
* **Frontend UI (Member 1)**: Submits transaction payloads and visualizes fraud risk analysis and stats.
* **ML Risk Engine (Member 1)**: Supplies predictive fraud scoring models.
* **Database & Persistence (Member 3)**: Manages SQLite/SQLAlchemy transaction storage, history retrieval, and aggregation.
* **Baseline Detection Rules (Member 4)**: Heuristic rules and security test cases.

---

## 2. Project Architecture

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app initialization, middleware, /health endpoint
│   ├── api/
│   │   ├── __init__.py             # API router aggregation
│   │   ├── dependencies.py         # FastAPI dependency injection for DB & Risk Engine
│   │   └── transactions.py         # /analyze, /history, /stats route handlers
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py               # Pydantic Settings & environment variables
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── transaction.py          # Pydantic models for requests, responses, & stats
│   └── services/
│       ├── __init__.py
│       ├── database.py             # Member 3 persistence interface & SQLAlchemy implementation
│       └── risk_engine.py          # Member 1 & 4 risk analysis interface & baseline rules
├── tests/
│   ├── __init__.py
│   └── test_api.py                 # Pytest test suite (100% test pass rate)
├── .env.example                    # Environment variable template
├── README.md                       # Backend documentation & integration guide
└── requirements.txt                # Python backend dependencies
```

---

## 3. Local Setup & Running the Server

### Prerequisites
* Python 3.11+ (tested on Python 3.14)
* Git

### Step-by-Step Instructions

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   * **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   * **Linux / macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

5. **Start the FastAPI development server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Interactive Documentation:**
   * Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   * ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
   * OpenAPI JSON: [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)

---

## 4. API Endpoints Contract

### A. Health Check
* **Route:** `GET /health`
* **Response:**
  ```json
  {
    "status": "ok",
    "service": "FinShield AI API"
  }
  ```

### B. Analyze Transaction
* **Route:** `POST /api/v1/transactions/analyze`
* **Request Body:**
  ```json
  {
    "amount": 25000,
    "transaction_type": "transfer",
    "timestamp": "2026-10-12T10:30:00Z",
    "sender_account": "acc_001",
    "recipient_account": "acc_002",
    "currency": "USD"
  }
  ```
* **Response Body (200 OK):**
  ```json
  {
    "transaction_id": "txn_demo_001",
    "risk_score": 72,
    "risk_level": "HIGH",
    "detected_signals": [
      "Unusual transaction pattern"
    ],
    "explanation": "Risk indicators were detected.",
    "recommended_action": "Verify the transaction independently.",
    "analysis_method": "rule_based",
    "analyzed_at": "2026-10-12T10:30:00Z"
  }
  ```
* **Validation & Error Codes:**
  * `422 Unprocessable Entity`: Validation failure (e.g., negative amount, empty transaction type).
  * `502 Bad Gateway`: Risk engine returned an out-of-bounds score (< 0 or > 100).
  * `503 Service Unavailable`: Risk engine outage or external timeout.
  * `500 Internal Server Error`: Persistence or unexpected internal error.

### C. Transaction History
* **Route:** `GET /api/v1/transactions/history?limit=50&offset=0`
* **Response (200 OK):**
  List of stored `RiskAnalysisResponse` objects ordered by analysis timestamp descending. Returns `[]` if database is empty.

### D. Real-Time Dashboard Statistics
* **Route:** `GET /api/v1/transactions/stats`
* **Response (200 OK):**
  ```json
  {
    "total_transactions": 1,
    "low_risk_count": 0,
    "medium_risk_count": 0,
    "high_risk_count": 1,
    "average_risk_score": 72.0
  }
  ```
  Returns `0` counts and `0.0` average score on an empty database (no fabricated metrics).

---

## 5. Teammate Integration Guide

### Member 1 — Frontend & ML Integration
* **Frontend Origin & CORS:**
  Configure `ALLOWED_ORIGINS` in `.env` (default includes `http://localhost:3000` and `http://localhost:5173`).
* **ML Model Integration:**
  Provide a callable matching the signature:
  ```python
  def analyze_transaction(transaction_data: TransactionCreate) -> RiskAnalysisResponse:
      ...
  ```
  To connect your model, simply update `app.services.risk_engine.analyze_transaction = your_ml_model_function` or configure it in `app/api/dependencies.py`.

### Member 3 — Database Integration
* Provide database models and session manager adhering to `DatabaseInterface` in `app/services/database.py`:
  - `save_transaction_analysis(raw_data, analysis) -> RiskAnalysisResponse`
  - `get_transaction_history(limit, offset) -> List[RiskAnalysisResponse]`
  - `get_transaction_stats() -> TransactionStatsResponse`
* Replace `get_default_db()` in `app/api/dependencies.py` with your database session factory.

### Member 4 — Detection Rules & Testing
* Rule heuristics can be plugged into `app/services/risk_engine.py`.
* Ensure risk scores remain strictly within `[0, 100]`.

---

## 6. Running Tests

Run pytest from the `backend/` directory:
```bash
pytest -v tests
```
All 20 test cases verify health, schema validation, isolated stubs, edge boundaries, error codes (422, 502, 503, 500), empty states, and SQLite persistence.
