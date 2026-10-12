"""FastAPI dependency providers for FinShield AI."""

from typing import Callable
from app.schemas.transaction import RiskAnalysisResponse, TransactionCreate
from app.services.database import DatabaseInterface, get_default_db
from app.services.risk_engine import analyze_transaction


def get_risk_engine() -> Callable[[TransactionCreate], RiskAnalysisResponse]:
    """Provides the active risk analysis engine function."""
    return analyze_transaction


def get_database() -> DatabaseInterface:
    """Provides the active transaction persistence repository."""
    return get_default_db()
