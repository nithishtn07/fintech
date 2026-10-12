# FinShield AI — Fraud-Risk Analysis Platform

[![Status](https://img.shields.io/badge/Status-Integration%20MVP-brightgreen.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20SQLite%20%7C%20ML-indigo.svg)](#)

AI-powered transaction fraud-risk analysis platform built for an 8-hour hackathon.

## Team Structure & Ownership
- **Member 1 (Frontend & ML)**: React + Vite + TypeScript Dashboard, ML Foundation, Feature Pipeline.
- **Member 2 (Backend API)**: FastAPI Core, Gateway, CORS, Endpoints (`/health`, `/analyze`, `/history`, `/stats`), Tests.
- **Member 3 (Database)**: SQLite / SQLAlchemy persistence, TransactionModel, History & Stats aggregation.
- **Member 4 (Detection Rules & Testing)**: Baseline heuristic rule evaluation & test validation.

---

## 1. System Overview

FinShield AI assesses digital payment fraud and scam risk in real time. It blends explainable rule-based risk indicators with machine-learning feature extraction to detect:
* High-value peer-to-peer transfers.
* Regulatory structuring evasions (amounts hovering near statutory thresholds).
* Velocity burst frequencies (rapid successive transactions).
* Unusual off-hours payment executions (late night 01:00–04:59).
* First-time unverified beneficiary interactions.

---

## 2. Architecture & Modules

```text
fintech 2/
├── backend/                         # Member 2 & 3: FastAPI Backend & SQLite
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point & CORS
│   │   ├── api/                     # /transactions & dependency injection
│   │   ├── core/config.py           # Pydantic Settings
│   │   ├── schemas/transaction.py   # Request & Response Pydantic models
│   │   └── services/
│   │       ├── database.py          # SQLite repository & DatabaseInterface
│   │       └── risk_engine.py       # Pluggable risk evaluation engine
│   ├── tests/test_api.py            # 20 Backend unit tests (100% pass)
│   ├── requirements.txt             # Python dependencies
│   └── README.md                    # Detailed backend guide
├── frontend/                        # Member 1: Cybersecurity Executive UI
│   ├── src/
│   │   ├── components/              # OverviewCards, TransactionForm, RiskResultCard,
│   │   │                            # RiskCharts, TransactionHistory, TopBar, Sidebar
│   │   ├── pages/Dashboard.tsx      # Main dashboard assembly
│   │   ├── services/api.ts          # Centralized API service with live/mock fallback
│   │   └── types/transaction.ts     # TypeScript contracts aligned with FastAPI
│   ├── package.json                 # React, Vite, Tailwind CSS, Recharts
│   └── README.md                    # Frontend guide
└── ml/                              # Member 1: Machine Learning Foundation
    ├── features.py                  # 19-dimensional feature extraction pipeline
    ├── schemas.py                   # MLFeatureVector & MLPredictionResult
    ├── model.py                     # BaseMLPredictor & MLModelManager
    ├── service.py                   # analyze_transaction() entry point
    └── tests/test_ml_foundation.py  # 8 ML unit tests (100% pass)
```

---

## 3. Quickstart & Running Instructions

### Backend (FastAPI)
```powershell
$env:PYTHONPATH="backend;."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Interactive API Documentation (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* Health Endpoint: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### Frontend (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
* Dashboard URL: [http://127.0.0.1:5173](http://127.0.0.1:5173)

### Running the Test Suite (28 Tests)
```powershell
$env:PYTHONPATH="backend;."
python -m pytest backend/tests/test_api.py ml/tests/test_ml_foundation.py -v
```

---

## 4. API Contract Summary

| Endpoint | Method | Request Payload | Response Model |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | *None* | `HealthResponse` (`status: "ok"`) |
| `/api/v1/transactions/analyze` | `POST` | `TransactionCreate` (`amount`, `transaction_type`, `recipient_account`, `metadata`) | `RiskAnalysisResponse` (`risk_score`, `risk_level`, `detected_signals`, `explanation`, `recommended_action`) |
| `/api/v1/transactions/history` | `GET` | Query: `limit`, `offset` | `List[RiskAnalysisResponse]` |
| `/api/v1/transactions/stats` | `GET` | *None* | `TransactionStatsResponse` (`total_transactions`, counts, `average_risk_score`) |
