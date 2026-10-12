"""Database persistence interface and SQLAlchemy SQLite implementation.

Collaborators:
- Member 3 (Database & Transaction Persistence): owns transaction schema,
  session management, and data persistence layer.
"""

import json
import logging
from datetime import datetime, timezone
from typing import List, Optional, Protocol

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    create_engine,
    func,
)
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings
from app.schemas.transaction import (
    RiskAnalysisResponse,
    RiskLevel,
    TransactionCreate,
    TransactionStatsResponse,
)

logger = logging.getLogger("finshield.database")

Base = declarative_base()


class TransactionModel(Base):
    """SQLAlchemy model representing an analyzed transaction."""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String(64), unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(64), nullable=False)
    sender_account = Column(String(128), nullable=True)
    recipient_account = Column(String(128), nullable=True)
    currency = Column(String(16), default="USD", nullable=False)
    timestamp = Column(DateTime, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(16), nullable=False)
    detected_signals_json = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    analysis_method = Column(String(32), nullable=False)
    analyzed_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class DatabaseError(Exception):
    """Raised when a database query or persistence operation fails."""
    pass


class DatabaseInterface(Protocol):
    """Agreed interface contract with Member 3 for data persistence."""

    def save_transaction_analysis(
        self, raw_data: TransactionCreate, analysis: RiskAnalysisResponse
    ) -> RiskAnalysisResponse:
        ...

    def get_transaction_history(
        self, limit: int = 50, offset: int = 0
    ) -> List[RiskAnalysisResponse]:
        ...

    def get_transaction_stats(self) -> TransactionStatsResponse:
        ...

    def check_health(self) -> bool:
        ...


class SQLAlchemyTransactionRepository:
    """
    Default SQLAlchemy SQLite repository adhering to Member 3's persistence interface.
    Member 3 can drop in their database session manager or model extensions directly.
    """

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or settings.DATABASE_URL
        connect_args = {"check_same_thread": False} if self.db_url.startswith("sqlite") else {}
        self.engine = create_engine(self.db_url, connect_args=connect_args)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self._init_db()

    def _init_db(self):
        """Create tables if they don't already exist."""
        try:
            Base.metadata.create_all(bind=self.engine)
        except Exception as exc:
            logger.error(f"Failed to initialize database tables: {exc}")
            raise DatabaseError(f"Database schema initialization failed: {str(exc)}") from exc

    def check_health(self) -> bool:
        """Verify database connectivity."""
        try:
            with self.SessionLocal() as session:
                session.execute(func.now() if not self.db_url.startswith("sqlite") else func.datetime("now"))
            return True
        except Exception as exc:
            logger.warning(f"Database health check failed: {exc}")
            return False

    def save_transaction_analysis(
        self, raw_data: TransactionCreate, analysis: RiskAnalysisResponse
    ) -> RiskAnalysisResponse:
        """Persists the transaction and risk analysis result."""
        try:
            with self.SessionLocal() as session:
                txn_record = TransactionModel(
                    transaction_id=analysis.transaction_id,
                    amount=raw_data.amount,
                    transaction_type=raw_data.transaction_type,
                    sender_account=raw_data.sender_account,
                    recipient_account=raw_data.recipient_account,
                    currency=raw_data.currency or "USD",
                    timestamp=raw_data.timestamp or datetime.now(timezone.utc),
                    risk_score=analysis.risk_score,
                    risk_level=analysis.risk_level.value if hasattr(analysis.risk_level, "value") else str(analysis.risk_level),
                    detected_signals_json=json.dumps(analysis.detected_signals),
                    explanation=analysis.explanation,
                    recommended_action=analysis.recommended_action,
                    analysis_method=analysis.analysis_method,
                    analyzed_at=analysis.analyzed_at,
                )
                session.add(txn_record)
                session.commit()
            return analysis
        except Exception as exc:
            logger.error(f"Failed to persist transaction analysis: {exc}", exc_info=True)
            raise DatabaseError(f"Database write operation failed: {str(exc)}") from exc

    def get_transaction_history(
        self, limit: int = 50, offset: int = 0
    ) -> List[RiskAnalysisResponse]:
        """Retrieves previously analyzed transactions ordered by analyzed_at descending."""
        try:
            with self.SessionLocal() as session:
                records = (
                    session.query(TransactionModel)
                    .order_by(TransactionModel.analyzed_at.desc())
                    .offset(offset)
                    .limit(limit)
                    .all()
                )

                results: List[RiskAnalysisResponse] = []
                for rec in records:
                    try:
                        signals = json.loads(rec.detected_signals_json)
                    except Exception:
                        signals = []

                    results.append(
                        RiskAnalysisResponse(
                            transaction_id=rec.transaction_id,
                            risk_score=rec.risk_score,
                            risk_level=RiskLevel(rec.risk_level),
                            detected_signals=signals,
                            explanation=rec.explanation,
                            recommended_action=rec.recommended_action,
                            analysis_method=rec.analysis_method,
                            analyzed_at=rec.analyzed_at,
                        )
                    )
                return results
        except Exception as exc:
            logger.error(f"Failed to retrieve transaction history: {exc}", exc_info=True)
            raise DatabaseError(f"Database read operation failed: {str(exc)}") from exc

    def get_transaction_stats(self) -> TransactionStatsResponse:
        """Computes live stats from stored transaction records."""
        try:
            with self.SessionLocal() as session:
                total = session.query(func.count(TransactionModel.id)).scalar() or 0
                if total == 0:
                    return TransactionStatsResponse(
                        total_transactions=0,
                        low_risk_count=0,
                        medium_risk_count=0,
                        high_risk_count=0,
                        average_risk_score=0.0,
                    )

                low_count = (
                    session.query(func.count(TransactionModel.id))
                    .filter(TransactionModel.risk_level == RiskLevel.LOW.value)
                    .scalar()
                    or 0
                )
                med_count = (
                    session.query(func.count(TransactionModel.id))
                    .filter(TransactionModel.risk_level == RiskLevel.MEDIUM.value)
                    .scalar()
                    or 0
                )
                high_count = (
                    session.query(func.count(TransactionModel.id))
                    .filter(TransactionModel.risk_level == RiskLevel.HIGH.value)
                    .scalar()
                    or 0
                )
                avg_score = (
                    session.query(func.avg(TransactionModel.risk_score)).scalar()
                    or 0.0
                )

                return TransactionStatsResponse(
                    total_transactions=total,
                    low_risk_count=low_count,
                    medium_risk_count=med_count,
                    high_risk_count=high_count,
                    average_risk_score=round(float(avg_score), 2),
                )
        except Exception as exc:
            logger.error(f"Failed to calculate transaction stats: {exc}", exc_info=True)
            raise DatabaseError(f"Database statistics aggregation failed: {str(exc)}") from exc


# Lazy singleton instance
_default_db_instance: Optional[DatabaseInterface] = None


def get_default_db() -> DatabaseInterface:
    global _default_db_instance
    if _default_db_instance is None:
        _default_db_instance = SQLAlchemyTransactionRepository()
    return _default_db_instance
