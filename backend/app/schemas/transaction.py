"""Pydantic schemas for transaction request and response validation."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class TransactionAnalyzeRequest(BaseModel):
    amount: float = Field(
        ...,
        gt=0,
        description="Transaction amount in specified currency (must be positive)",
        examples=[2450.00]
    )
    currency: str = Field(
        default="INR",
        description="Currency code (e.g. INR)",
        examples=["INR"]
    )
    transaction_type: str = Field(
        ...,
        description="Type of transaction (e.g., P2P, MERCHANT, BILL_PAYMENT, CASH_WITHDRAWAL, INTERNATIONAL)",
        examples=["P2P"]
    )
    payment_method: str = Field(
        ...,
        description="Payment rails or instrument (e.g., UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING, WALLET)",
        examples=["UPI"]
    )
    transaction_hour: Optional[int] = Field(
        default=None,
        ge=0,
        le=23,
        description="Hour of day (0-23) when transaction occurred",
        examples=[14]
    )
    timestamp: Optional[datetime] = Field(
        default=None,
        description="Optional ISO timestamp of transaction"
    )
    velocity_1h: Optional[int] = Field(
        default=None,
        ge=0,
        description="Number of transactions initiated in the past 1 hour",
        examples=[2]
    )
    velocity_24h: Optional[int] = Field(
        default=None,
        ge=0,
        description="Number of transactions initiated in the past 24 hours",
        examples=[5]
    )
    recipient_id: Optional[str] = Field(
        default=None,
        description="Synthetic recipient identifier (generated automatically if omitted)",
        examples=["REC-98234-IN"]
    )
    is_new_recipient: Optional[bool] = Field(
        default=False,
        description="Whether this recipient is newly added / first-time transfer"
    )

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        v_upper = v.strip().upper()
        if not v_upper:
            return "INR"
        return v_upper

    @field_validator("transaction_type", "payment_method")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        v_clean = v.strip()
        if not v_clean:
            raise ValueError("Field cannot be empty")
        return v_clean


class SignalDetail(BaseModel):
    code: str
    title: str
    description: str
    severity: str  # INFO, WARNING, CRITICAL
    points: float


class TransactionAnalyzeResponse(BaseModel):
    transaction_id: str
    amount: float
    currency: str
    transaction_type: str
    payment_method: str
    recipient_id: str
    risk_score: float
    risk_level: str  # LOW, MEDIUM, HIGH
    detected_signals: List[str]
    signal_details: Optional[List[SignalDetail]] = None
    explanation: str
    recommended_action: str
    analyzed_at: datetime
    analysis_method: str = "RULE_BASED_BASELINE"

    model_config = {
        "from_attributes": True
    }


class TransactionHistoryResponse(BaseModel):
    items: List[TransactionAnalyzeResponse]
    total: int
    limit: int
    offset: int


class TransactionStatsResponse(BaseModel):
    total_transactions: int
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    low_risk_percentage: float
    medium_risk_percentage: float
    high_risk_percentage: float
    average_risk_score: float
    total_volume_inr: float
