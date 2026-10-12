"""Database models for FinShield AI."""
from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, Float, String, DateTime, Text, Boolean
from app.db.database import Base


class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(String(64), unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    transaction_type = Column(String(50), nullable=False)
    payment_method = Column(String(50), nullable=False)
    recipient_id = Column(String(64), nullable=False, index=True)
    
    # Optional context indicators
    transaction_hour = Column(Integer, nullable=True)
    velocity_1h = Column(Integer, nullable=True)
    velocity_24h = Column(Integer, nullable=True)
    is_new_recipient = Column(Boolean, default=False, nullable=True)
    
    # Analysis outputs
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False, index=True)  # LOW, MEDIUM, HIGH
    detected_signals_json = Column(Text, nullable=False, default="[]")
    explanation = Column(Text, nullable=False)
    recommended_action = Column(String(50), nullable=False)
    analysis_method = Column(String(50), default="RULE_BASED_BASELINE", nullable=False)
    analyzed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def detected_signals(self) -> list:
        try:
            return json.loads(self.detected_signals_json)
        except (ValueError, TypeError):
            return []

    @detected_signals.setter
    def detected_signals(self, signals: list):
        self.detected_signals_json = json.dumps(signals)
