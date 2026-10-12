"""Transaction risk analysis and history endpoints."""

import logging
from typing import Callable, List
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_database, get_risk_engine
from app.schemas.transaction import (
    RiskAnalysisResponse,
    TransactionCreate,
    TransactionStatsResponse,
)
from app.services.database import DatabaseError, DatabaseInterface
from app.services.risk_engine import InvalidRiskScoreError, RiskEngineError

logger = logging.getLogger("finshield.api.transactions")

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post(
    "/analyze",
    response_model=RiskAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze transaction fraud risk",
    description="Accepts transaction details, coordinates risk analysis, persists results, and returns evaluated risk indicators.",
)
def analyze_transaction_endpoint(
    payload: TransactionCreate,
    risk_engine: Callable[[TransactionCreate], RiskAnalysisResponse] = Depends(get_risk_engine),
    db: DatabaseInterface = Depends(get_database),
) -> RiskAnalysisResponse:
    """
    Coordinates fraud-risk assessment for an incoming transaction:
    1. Validates request payload via Pydantic.
    2. Invokes the risk analysis engine.
    3. Verifies risk score boundaries (0-100).
    4. Persists the transaction and analysis result via database interface.
    5. Returns the structured risk analysis response.
    """
    logger.info(
        f"Processing transaction analysis request: type={payload.transaction_type}, "
        f"amount={payload.amount}, currency={payload.currency}"
    )

    # 1. Execute risk engine analysis
    try:
        analysis_result = risk_engine(payload)
    except (InvalidRiskScoreError, ValueError) as exc:
        logger.error(f"Risk engine returned invalid score or values: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Risk analysis engine returned an invalid result: {str(exc)}",
        )
    except RiskEngineError as exc:
        logger.error(f"Risk engine service error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Risk analysis service unavailable: {str(exc)}",
        )
    except Exception as exc:
        logger.error(f"Unexpected error executing risk engine: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected failure during risk evaluation.",
        )

    # 2. Re-validate score bounds defensively
    if analysis_result.risk_score < 0 or analysis_result.risk_score > 100:
        logger.error(f"Risk score out of bounds: {analysis_result.risk_score}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Risk score {analysis_result.risk_score} is outside allowed range (0-100).",
        )

    # 3. Persist analysis to database
    try:
        saved_result = db.save_transaction_analysis(raw_data=payload, analysis=analysis_result)
    except DatabaseError as exc:
        logger.error(f"Database error while saving transaction analysis: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database persistence error while saving transaction analysis.",
        )
    except Exception as exc:
        logger.error(f"Unexpected error while saving transaction analysis: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error occurred while persisting transaction data.",
        )

    logger.info(
        f"Transaction analysis completed: id={saved_result.transaction_id}, "
        f"score={saved_result.risk_score}, level={saved_result.risk_level}"
    )
    return saved_result


@router.get(
    "/history",
    response_model=List[RiskAnalysisResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve analyzed transaction history",
    description="Retrieves previously analyzed transactions from the database ordered by analysis timestamp descending.",
)
def get_transaction_history_endpoint(
    limit: int = Query(default=50, ge=1, le=100, description="Max records to return"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    db: DatabaseInterface = Depends(get_database),
) -> List[RiskAnalysisResponse]:
    """Retrieves stored transaction analyses from the persistence layer."""
    try:
        return db.get_transaction_history(limit=limit, offset=offset)
    except DatabaseError as exc:
        logger.error(f"Database error retrieving transaction history: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transaction history from database.",
        )
    except Exception as exc:
        logger.error(f"Unexpected error retrieving transaction history: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected database error occurred.",
        )


@router.get(
    "/stats",
    response_model=TransactionStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve real-time transaction risk statistics",
    description="Aggregates metrics directly from persisted records (total transactions, risk distribution, average score).",
)
def get_transaction_stats_endpoint(
    db: DatabaseInterface = Depends(get_database),
) -> TransactionStatsResponse:
    """Computes and returns summary dashboard statistics from stored data."""
    try:
        return db.get_transaction_stats()
    except DatabaseError as exc:
        logger.error(f"Database error calculating statistics: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate transaction statistics from database.",
        )
    except Exception as exc:
        logger.error(f"Unexpected error calculating statistics: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error occurred while aggregating statistics.",
        )
