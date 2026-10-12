"""Main FastAPI application entry point for FinShield AI."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import init_db, SessionLocal
from app.db.models import TransactionModel
from app.api.routes import health, transactions
from app.services.risk_service import BaselineRiskEngine
from app.schemas.transaction import TransactionAnalyzeRequest


def seed_initial_demo_data():
    """Seed initial synthetic demonstration transactions if database is fresh."""
    db: Session = SessionLocal()
    try:
        count = db.query(TransactionModel).count()
        if count == 0:
            demo_samples = [
                TransactionAnalyzeRequest(
                    amount=650.0,
                    currency="INR",
                    transaction_type="MERCHANT",
                    payment_method="UPI",
                    transaction_hour=14,
                    velocity_1h=1,
                    velocity_24h=3,
                    recipient_id="REC-DEMO-GROCERY",
                    is_new_recipient=False,
                ),
                TransactionAnalyzeRequest(
                    amount=49800.0,
                    currency="INR",
                    transaction_type="P2P",
                    payment_method="UPI",
                    transaction_hour=2,
                    velocity_1h=4,
                    velocity_24h=8,
                    recipient_id="REC-DEMO-SUSPECT",
                    is_new_recipient=True,
                ),
                TransactionAnalyzeRequest(
                    amount=52000.0,
                    currency="INR",
                    transaction_type="MERCHANT",
                    payment_method="CREDIT_CARD",
                    transaction_hour=11,
                    velocity_1h=1,
                    velocity_24h=2,
                    recipient_id="REC-DEMO-ELECTRONICS",
                    is_new_recipient=False,
                ),
                TransactionAnalyzeRequest(
                    amount=1850.0,
                    currency="INR",
                    transaction_type="BILL_PAYMENT",
                    payment_method="NET_BANKING",
                    transaction_hour=16,
                    velocity_1h=0,
                    velocity_24h=1,
                    recipient_id="REC-DEMO-UTILITY",
                    is_new_recipient=False,
                ),
                TransactionAnalyzeRequest(
                    amount=175000.0,
                    currency="INR",
                    transaction_type="P2P",
                    payment_method="UPI",
                    transaction_hour=3,
                    velocity_1h=6,
                    velocity_24h=14,
                    recipient_id="REC-DEMO-NIGHTDRAIN",
                    is_new_recipient=True,
                ),
            ]
            for item in demo_samples:
                res = BaselineRiskEngine.evaluate(item)
                rec = TransactionModel(
                    transaction_id=res.transaction_id,
                    amount=res.amount,
                    currency=res.currency,
                    transaction_type=res.transaction_type,
                    payment_method=res.payment_method,
                    recipient_id=res.recipient_id,
                    transaction_hour=item.transaction_hour,
                    velocity_1h=item.velocity_1h,
                    velocity_24h=item.velocity_24h,
                    is_new_recipient=item.is_new_recipient,
                    risk_score=res.risk_score,
                    risk_level=res.risk_level,
                    detected_signals_json=str(res.detected_signals).replace("'", '"'),
                    explanation=res.explanation,
                    recommended_action=res.recommended_action,
                    analysis_method=res.analysis_method,
                    analyzed_at=res.analyzed_at,
                )
                db.add(rec)
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Demo seeding skipped: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize tables and initial seed data if needed
    init_db()
    seed_initial_demo_data()
    yield
    # Shutdown logic if any


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FinShield AI — Real-time Digital Payment Fraud & Scam Detection Platform (Phase 1 Baseline)",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [o.strip() for o in origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root level health endpoint
app.include_router(health.router)

# Versioned API routes under /api/v1
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(transactions.router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": "/health",
        "api_v1": settings.API_V1_STR,
    }
