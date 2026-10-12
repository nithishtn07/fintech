"""Pydantic schemas for FinShield AI transaction analysis."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AnalysisMethod(str, Enum):
    RULE_BASED = "rule_based"
    ML_MODEL = "ml_model"
    HYBRID = "hybrid"


class TransactionCreate(BaseModel):
    """
    Incoming transaction request payload for fraud risk analysis.
    Agreed contract with Member 1 (Frontend & ML) and Member 4 (Detection Rules).
    """
    amount: float = Field(..., gt=0, description="Transaction monetary amount (must be > 0)")
    transaction_type: str = Field(..., min_length=1, description="Type of transaction (e.g., transfer, payment, withdrawal)")
    timestamp: Optional[datetime] = Field(
        default=None,
        description="ISO-8601 transaction timestamp. If omitted, current UTC time is used."
    )
    transaction_id: Optional[str] = Field(
        default=None,
        description="Optional upstream unique transaction identifier"
    )
    sender_account: Optional[str] = Field(
        default=None,
        description="Sender account or user identifier"
    )
    recipient_account: Optional[str] = Field(
        default=None,
        description="Recipient account identifier"
    )
    currency: Optional[str] = Field(
        default="USD",
        description="ISO currency code (default: USD)"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional non-sensitive contextual metadata"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "amount": 25000,
                "transaction_type": "transfer",
                "timestamp": "2026-10-12T10:30:00Z"
            }
        }
    }


class RiskAnalysisResponse(BaseModel):
    """
    Structured fraud risk analysis result.
    Contract agreed across Frontend, ML Engine, Detection Rules, and Database.
    """
    transaction_id: str = Field(..., description="Unique transaction identifier")
    risk_score: int = Field(..., ge=0, le=100, description="Risk score strictly between 0 and 100")
    risk_level: RiskLevel = Field(..., description="Categorical risk tier: LOW, MEDIUM, or HIGH")
    detected_signals: List[str] = Field(default_factory=list, description="Detected fraud/risk signals")
    explanation: str = Field(..., description="Objective explanation of detected risk indicators")
    recommended_action: str = Field(..., description="Recommended mitigation or verification action")
    analysis_method: str = Field(..., description="Method used for analysis (e.g., rule_based, ml_model, hybrid)")
    analyzed_at: datetime = Field(..., description="ISO-8601 timestamp of analysis")

    @field_validator("risk_score")
    @classmethod
    def validate_risk_score_bounds(cls, v: int) -> int:
        if v < 0 or v > 100:
            raise ValueError("risk_score must be between 0 and 100")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
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
        }
    }


class TransactionStatsResponse(BaseModel):
    """
    Dashboard metrics computed strictly from real stored records.
    """
    total_transactions: int = Field(..., ge=0, description="Total number of analyzed transactions")
    low_risk_count: int = Field(..., ge=0, description="Total transactions classified as LOW risk")
    medium_risk_count: int = Field(..., ge=0, description="Total transactions classified as MEDIUM risk")
    high_risk_count: int = Field(..., ge=0, description="Total transactions classified as HIGH risk")
    average_risk_score: float = Field(..., ge=0.0, le=100.0, description="Average risk score (0.0 if empty)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_transactions": 0,
                "low_risk_count": 0,
                "medium_risk_count": 0,
                "high_risk_count": 0,
                "average_risk_score": 0.0
            }
        }
    }


class HealthResponse(BaseModel):
    """
    API health status response schema.
    """
    status: str = Field(default="ok", description="API operational status")
    service: str = Field(default="FinShield AI API", description="Service name")
