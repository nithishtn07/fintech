# FinShield AI — Fraud & Scam Risk Analysis Platform

[![Phase](https://img.shields.io/badge/Phase-1%20Foundation%20%26%20MVP-blue.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20Python%20ML-indigo.svg)](#)
[![Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](#)

> **Hackathon Project — FinShield AI**  
> An AI-powered, explainable digital payment transaction risk analysis platform built by a team of four.  
> **Assigned Responsibilities for this Module:** **Frontend Dashboard** & **Machine Learning Risk Engine**.  
> *(Teammates independently manage Backend FastAPI routing, SQLite/SQLAlchemy database models, and baseline heuristic rules).*

---

## 1. Project Overview

FinShield AI empowers fintech operators, risk compliance officers, and everyday consumers to evaluate transaction risk in real time. It blends explainable deterministic signals with machine-learning feature representations to flag high-risk transactions, account takeover bursts, off-hours draining, and regulatory structuring evasions.

### Core Demonstration Workflow
1. **Input Transaction**: Specify transaction amount, payment rail (UPI, Credit Card, etc.), channel, and telemetry (hour, velocity, new beneficiary).
2. **Instant Evaluation**: Submit the payload to calculate a composite **Risk Score (0–100)** and assign a calibrated **Risk Tier (LOW, MEDIUM, HIGH)**.
3. **Explainable Signals**: Unpack heuristic risk drivers (e.g. *Structuring Evasion*, *Extreme Burst Velocity*, *Off-Hours Draining*).
4. **Policy Recommendation**: Receive actionable policy steps (`ALLOW`, `STEP_UP_AUTH`, `HOLD_FOR_REVIEW`).
5. **Audit History & Telemetry**: Inspect persisted historical transaction logs and visual risk distribution charts.

---

## 2. Phase 1 Implemented Features

### A. Frontend Cybersecurity Dashboard (`frontend/`)
- **Executive Dark Cybersecurity Interface**: Built with React 18, Vite, TypeScript, and Tailwind CSS. Styled in dark charcoal/navy with cyan, emerald, amber, and rose accents.
- **Transaction Risk Evaluator**: Validated transaction input form with support for INR currency, payment rails (UPI, Credit Card, Debit Card, Net Banking, Wallet), channel types (P2P, Merchant, Bill Payment, Cash Withdrawal, International), and behavioral telemetry.
- **Quick Demonstration Presets**: One-click demo scenarios for testing:
  - *Daytime Grocery (Safe)* — Low risk
  - *Regulatory Structuring (₹49,800)* — Medium risk
  - *Midnight Drain Scam (₹1,75,000)* — High risk
- **Composite Risk Assessment Card**:
  - Calibrated 0–100 visual risk progress meter.
  - Risk tier badges (`LOW`, `MEDIUM`, `HIGH`).
  - Explainable heuristic reasoning and point breakdown.
  - Recommended policy actions.
- **Real-Time Audit Trail**: Chronological log of evaluated transactions from the database with risk filtering (`ALL`, `LOW`, `MEDIUM`, `HIGH`) and one-click transaction ID copying.
- **Aggregated Risk Telemetry**: Cards displaying Total Records Analyzed, Low Risk count & %, Medium Risk count & %, High Risk count & %, and Processed Volume.
- **Distribution Charts (Recharts)**:
  - *Risk Tier Breakdown*: Donut chart illustrating low/med/high proportions.
  - *Payment Rail Frequency*: Bar chart breaking down volume by rail.
  - *Safe Empty State*: Gracefully displays placeholder states when no transactions exist.
- **Transparent Mock & Live Mode**:
  - Live health check query to `http://127.0.0.1:8000/health`.
  - Seamless fallback to an isolated development mock engine if the backend is offline.
  - Clear banner indicator: Never silently claims mock fixtures are live results.
  - Manual toggle to force mock mode for standalone frontend demos.

### B. Machine Learning Risk Foundation (`ml/`)
- **Standardized Feature Pipeline (`ml/features.py`)**: 19-dimensional numeric and categorical vector extractor (`TransactionFeatureExtractor`) computing log amounts, structuring boundaries, velocity acceleration ratios, temporal off-hours flags, and one-hot rail/type encodings.
- **Model Governance & Contracts (`ml/schemas.py`)**: Typed dataclasses for `MLFeatureVector`, `MLPredictionResult`, `FeatureContribution`, and `ModelMetadata`.
- **Artifact Lifecycle Manager (`ml/model.py`)**: `MLModelManager` and `BaseMLPredictor` protocols. Correctly raises `ModelNotLoadedError` if model weights are requested before training.
- **High-Level Service Interface (`ml/service.py`)**: `analyze_transaction(transaction_data)` entry point function with documented integration boundaries for the backend teammate.
- **Honest Governance**: In accordance with Phase 1 requirements, no fake model accuracy or synthetic weights are bundled. Phase 2 will implement training on curated transaction fraud datasets.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS 3.4, Recharts 2.12, Lucide React |
| **Backend Integration** | Python 3.13, FastAPI, Uvicorn, SQLite, SQLAlchemy, Pydantic v2 |
| **Machine Learning** | Python 3.13, scikit-learn, NumPy, Pandas |
| **Testing** | Pytest, TypeScript (`tsc -b`), Vite Build |

---

## 4. Project Structure

```text
fintech 2/
├── .env.example                     # Root environment configuration template
├── README.md                        # Master project documentation
├── backend/                         # Backend API & Database (Managed by Teammates)
│   ├── app/
│   │   ├── api/routes/              # /health and /api/v1/transactions
│   │   ├── core/config.py           # Settings and CORS
│   │   ├── db/                      # SQLAlchemy models and SQLite connection
│   │   ├── schemas/                 # Transaction Pydantic schemas
│   │   ├── services/risk_service.py # Deterministic Baseline Engine
│   │   └── main.py                  # FastAPI application entry point
│   ├── requirements.txt             # Python backend dependencies
│   └── tests/                       # Pytest test suite (test_health, test_transactions)
├── frontend/                        # Frontend Dashboard (Assigned Responsibility)
│   ├── public/                      # Static assets and icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Badge, LoadingSpinner
│   │   │   ├── dashboard/           # OverviewCards, TransactionForm, RiskResultCard,
│   │   │   │                        # RiskCharts, TransactionHistory
│   │   │   └── layout/              # Sidebar, TopBar
│   │   ├── pages/
│   │   │   └── Dashboard.tsx        # Executive Dashboard page
│   │   ├── services/
│   │   │   ├── api.ts               # Centralized API service with live/mock fallback
│   │   │   └── mockData.ts          # Isolated development mock fixtures
│   │   ├── types/
│   │   │   ├── transaction.ts       # Shared TypeScript data contracts
│   │   │   └── index.ts             # Re-exports
│   │   ├── App.tsx                  # Root layout router
│   │   ├── index.css                # Tailwind directives and theme styles
│   │   └── main.tsx                 # React DOM mount point
│   ├── .env.example                 # Frontend env configuration
│   ├── package.json                 # Node dependencies
│   └── vite.config.ts               # Vite configuration
├── ml/                              # Machine Learning Foundation (Assigned Responsibility)
│   ├── __init__.py                  # Package exports
│   ├── exceptions.py                # ModelNotLoadedError, FeatureExtractionError
│   ├── features.py                  # 19-dimensional feature extraction pipeline
│   ├── model.py                     # BaseMLPredictor & MLModelManager
│   ├── schemas.py                   # MLFeatureVector & MLPredictionResult
│   ├── service.py                   # analyze_transaction() & backend boundary docs
│   └── tests/                       # ML Foundation unit test suite
└── data/
    └── finshield.db                 # SQLite database storage
```

---

## 5. Setup & Running Instructions

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)

### Running the Backend (FastAPI)
```bash
# Set PYTHONPATH to include backend and root
# Windows PowerShell:
$env:PYTHONPATH="backend;."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Linux/macOS:
export PYTHONPATH="backend:."
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Running the Frontend (React + Vite)
```bash
cd frontend
npm install   # If running for the first time
npm run dev
```
Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

---

## 6. Shared API Contract

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Application health and operational status |
| `POST` | `/api/v1/transactions/analyze` | Evaluate transaction and persist to SQLite |
| `GET` | `/api/v1/transactions/history` | Retrieve chronological transaction history |
| `GET` | `/api/v1/transactions/stats` | Retrieve aggregated metrics calculated from DB |

### Example Analysis Response
```json
{
  "transaction_id": "TXN-74A9DE0CED15",
  "amount": 175000.0,
  "currency": "INR",
  "transaction_type": "P2P",
  "payment_method": "UPI",
  "recipient_id": "REC-DEMO-NIGHTDRAIN",
  "risk_score": 100.0,
  "risk_level": "HIGH",
  "detected_signals": [
    "HIGH_VALUE_UNSECURED_TRANSFER",
    "EXTREME_BURST_VELOCITY_1H",
    "UNUSUAL_OFF_HOURS_HIGH_RISK_ACTIVITY"
  ],
  "explanation": "Assessed as HIGH Risk (Score: 100.0/100) triggering 5 rule indicators.",
  "recommended_action": "HOLD_FOR_REVIEW",
  "analyzed_at": "2026-10-12T06:11:03.544590Z",
  "analysis_method": "RULE_BASED_BASELINE"
}
```

---

## 7. Testing & Verification

Run the test suite across backend and ML modules:
```bash
# Windows PowerShell:
$env:PYTHONPATH="backend;."
python -m pytest ml/tests backend/tests -v

# Frontend TypeScript check and production build:
cd frontend
npm run build
```

---

## 8. Current Limitations & Phase 2 Roadmap

### Current Limitations (Phase 1 MVP)
- **Model Training**: ML feature extraction and interfaces are fully functional, but model inference uses the deterministic baseline engine because model weights have not yet been trained on external fraud datasets.
- **Static Storage**: Transactions are stored in a local SQLite file (`data/finshield.db`).
- **Synthetic Data Only**: All demo transactions use synthetic recipient IDs and simulated velocity values.

### Phase 2 Roadmap
1. **Train Supervised ML Model**: Train an XGBoost or LightGBM classifier on credit card and UPI fraud benchmark datasets.
2. **Hybrid Scoring Engine**: Combine rule-based policy floors with ML probability outputs in `app/services/risk_service.py`.
3. **SHAP Feature Importance**: Expose local SHAP value graphs on the frontend dashboard.
4. **Scam SMS & Phishing NLP Module**: Analyze incoming SMS payment request strings.
