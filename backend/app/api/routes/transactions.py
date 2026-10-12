"""Transaction analysis, history, and statistical routes."""
from typing import List, Optional
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.database import get_db
from app.db.models import TransactionModel
from app.schemas.transaction import (
    TransactionAnalyzeRequest,
    TransactionAnalyzeResponse,
    TransactionStatsResponse,
)
from app.services.risk_service import BaselineRiskEngine
from app.core.config import settings

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post(
    "/analyze",
    response_model=TransactionAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze transaction for fraud and scam indicators"
)
def analyze_transaction(
    request: TransactionAnalyzeRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates a transaction payload using the explainable baseline rule engine
    and persists the analysis record in the SQLite database.
    """
    try:
        # Run explainable rule-based evaluation
        analysis = BaselineRiskEngine.evaluate(request)

        # Persist to database
        record = TransactionModel(
            transaction_id=analysis.transaction_id,
            amount=analysis.amount,
            currency=analysis.currency,
            transaction_type=analysis.transaction_type,
            payment_method=analysis.payment_method,
            recipient_id=analysis.recipient_id,
            transaction_hour=request.transaction_hour,
            velocity_1h=request.velocity_1h,
            velocity_24h=request.velocity_24h,
            is_new_recipient=request.is_new_recipient,
            risk_score=analysis.risk_score,
            risk_level=analysis.risk_level,
            detected_signals_json=json.dumps(analysis.detected_signals),
            explanation=analysis.explanation,
            recommended_action=analysis.recommended_action,
            analysis_method=analysis.analysis_method,
            analyzed_at=analysis.analyzed_at,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return analysis
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transaction risk evaluation failed: {str(exc)}"
        )


@router.get(
    "/history",
    response_model=List[TransactionAnalyzeResponse],
    summary="Retrieve history of analyzed transactions"
)
def get_transaction_history(
    limit: int = Query(default=50, ge=1, le=100, description="Max transactions to return"),
    offset: int = Query(default=0, ge=0, description="Number of records to skip"),
    risk_level: Optional[str] = Query(default=None, description="Optional filter by risk level (LOW, MEDIUM, HIGH)"),
    db: Session = Depends(get_db)
):
    """
    Returns recent analyzed transactions, newest first, with configurable limit.
    """
    query = db.query(TransactionModel)

    if risk_level:
        risk_level_clean = risk_level.strip().upper()
        if risk_level_clean in ["LOW", "MEDIUM", "HIGH"]:
            query = query.filter(TransactionModel.risk_level == risk_level_clean)

    records = (
        query.order_by(desc(TransactionModel.id))
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []
    for r in records:
        results.append(
            TransactionAnalyzeResponse(
                transaction_id=r.transaction_id,
                amount=r.amount,
                currency=r.currency,
                transaction_type=r.transaction_type,
                payment_method=r.payment_method,
                recipient_id=r.recipient_id,
                risk_score=r.risk_score,
                risk_level=r.risk_level,
                detected_signals=r.detected_signals,
                explanation=r.explanation,
                recommended_action=r.recommended_action,
                analyzed_at=r.analyzed_at,
                analysis_method=r.analysis_method,
            )
        )
    return results


@router.get(
    "/stats",
    response_model=TransactionStatsResponse,
    summary="Get aggregated risk statistics calculated from stored records"
)
def get_transaction_stats(db: Session = Depends(get_db)):
    """
    Calculates live statistics directly from stored database records.
    """
    total = db.query(func.count(TransactionModel.id)).scalar() or 0
    low_count = (
        db.query(func.count(TransactionModel.id))
        .filter(TransactionModel.risk_level == "LOW")
        .scalar()
        or 0
    )
    medium_count = (
        db.query(func.count(TransactionModel.id))
        .filter(TransactionModel.risk_level == "MEDIUM")
        .scalar()
        or 0
    )
    high_count = (
        db.query(func.count(TransactionModel.id))
        .filter(TransactionModel.risk_level == "HIGH")
        .scalar()
        or 0
    )
    avg_score = db.query(func.avg(TransactionModel.risk_score)).scalar() or 0.0
    total_volume = db.query(func.sum(TransactionModel.amount)).scalar() or 0.0

    low_pct = round((low_count / total * 100), 1) if total > 0 else 0.0
    med_pct = round((medium_count / total * 100), 1) if total > 0 else 0.0
    high_pct = round((high_count / total * 100), 1) if total > 0 else 0.0

    return TransactionStatsResponse(
        total_transactions=total,
        low_risk_count=low_count,
        medium_risk_count=medium_count,
        high_risk_count=high_count,
        low_risk_percentage=low_pct,
        medium_risk_percentage=med_pct,
        high_risk_percentage=high_pct,
        average_risk_score=round(float(avg_score), 1),
        total_volume_inr=round(float(total_volume), 2),
    )
