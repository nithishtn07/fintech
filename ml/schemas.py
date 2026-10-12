"""Data contracts and schemas for ML feature extraction and inference."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional, Any


class ModelStatus(str, Enum):
    UNLOADED = "UNLOADED"
    NOT_TRAINED = "NOT_TRAINED"
    LOADING = "LOADING"
    READY = "READY"
    ERROR = "ERROR"


@dataclass
class MLFeatureVector:
    """Extracted numeric & categorical features transformed from raw transaction."""
    amount: float
    amount_log: float
    is_structuring_range: int  # 1 if in 49k-50k or 99k-100k
    transaction_hour: int
    is_late_night: int  # 1 if between 01:00 and 04:59
    velocity_1h: int
    velocity_24h: int
    velocity_acceleration: float  # velocity_1h / max(velocity_24h / 24, 0.1)
    is_new_recipient: int
    rail_upi: int
    rail_credit_card: int
    rail_debit_card: int
    rail_net_banking: int
    rail_wallet: int
    type_p2p: int
    type_merchant: int
    type_bill_payment: int
    type_cash_withdrawal: int
    type_international: int

    def to_array(self) -> List[float]:
        """Convert feature vector to ordered numeric array suitable for scikit-learn models."""
        return [
            float(self.amount),
            float(self.amount_log),
            float(self.is_structuring_range),
            float(self.transaction_hour),
            float(self.is_late_night),
            float(self.velocity_1h),
            float(self.velocity_24h),
            float(self.velocity_acceleration),
            float(self.is_new_recipient),
            float(self.rail_upi),
            float(self.rail_credit_card),
            float(self.rail_debit_card),
            float(self.rail_net_banking),
            float(self.rail_wallet),
            float(self.type_p2p),
            float(self.type_merchant),
            float(self.type_bill_payment),
            float(self.type_cash_withdrawal),
            float(self.type_international),
        ]

    def to_dict(self) -> Dict[str, Any]:
        """Convert feature vector to dictionary for logging and inspectability."""
        return {
            "amount": self.amount,
            "amount_log": self.amount_log,
            "is_structuring_range": self.is_structuring_range,
            "transaction_hour": self.transaction_hour,
            "is_late_night": self.is_late_night,
            "velocity_1h": self.velocity_1h,
            "velocity_24h": self.velocity_24h,
            "velocity_acceleration": self.velocity_acceleration,
            "is_new_recipient": self.is_new_recipient,
            "rails": {
                "upi": self.rail_upi,
                "credit_card": self.rail_credit_card,
                "debit_card": self.rail_debit_card,
                "net_banking": self.rail_net_banking,
                "wallet": self.rail_wallet,
            },
            "types": {
                "p2p": self.type_p2p,
                "merchant": self.type_merchant,
                "bill_payment": self.type_bill_payment,
                "cash_withdrawal": self.type_cash_withdrawal,
                "international": self.type_international,
            },
        }


@dataclass
class FeatureContribution:
    """Individual feature risk contribution for explainability."""
    feature_name: str
    contribution_score: float
    description: str


@dataclass
class MLPredictionResult:
    """Structured inference output from machine-learning model."""
    transaction_id: str
    risk_score: float  # Calibrated 0.0 to 100.0
    risk_level: str  # LOW, MEDIUM, HIGH
    fraud_probability: float  # Raw model probability [0.0, 1.0]
    model_version: str
    is_model_trained: bool
    explanation: str
    detected_signals: List[str] = field(default_factory=list)
    top_feature_contributions: List[FeatureContribution] = field(default_factory=list)
    analyzed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    recommended_action: str = "ALLOW"


@dataclass
class ModelMetadata:
    """Status and governance metadata for ML models."""
    model_name: str
    version: str
    status: ModelStatus
    framework: str
    features: List[str]
    is_trained: bool
    artifact_path: Optional[str] = None
    metrics: Dict[str, float] = field(default_factory=dict)
    notes: str = ""
