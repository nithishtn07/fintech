"""Risk analysis engine interface and baseline implementation.

Collaborators:
- Member 1 (Frontend & ML): integrate ML model via `analyze_transaction`
- Member 4 (Baseline Detection Rules & Testing): provide baseline rule heuristics
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Callable

from app.schemas.transaction import (
    AnalysisMethod,
    RiskAnalysisResponse,
    RiskLevel,
    TransactionCreate,
)

logger = logging.getLogger("finshield.risk_engine")


class RiskEngineError(Exception):
    """Raised when the risk engine fails or encounters an unexpected error."""
    pass


class InvalidRiskScoreError(Exception):
    """Raised when the risk engine returns an invalid risk score."""
    pass


def baseline_analyze_transaction(transaction_data: TransactionCreate) -> RiskAnalysisResponse:
    """
    Default baseline risk evaluation logic.
    Can be replaced or extended by Member 4 (detection rules) or Member 1 (ML engine).

    Provides deterministic risk scoring for synthetic test transactions:
    - Amount > 50,000: High risk score (85), HIGH risk
    - Amount > 10,000: Elevated risk score (72), HIGH risk
    - Amount > 2,500: Moderate risk score (45), MEDIUM risk
    - Amount <= 2,500: Standard risk score (15), LOW risk
    """
    try:
        txn_id = transaction_data.transaction_id or f"txn_{uuid.uuid4().hex[:10]}"
        amount = transaction_data.amount
        signals = []

        if amount > 50000:
            risk_score = 85
            risk_level = RiskLevel.HIGH
            signals.append("Extreme monetary value transfer")
            explanation = "Transaction amount significantly exceeds standard baseline parameters."
            recommended_action = "Require multi-party authorization and secondary identity verification."
        elif amount > 10000:
            risk_score = 72
            risk_level = RiskLevel.HIGH
            signals.append("Unusual transaction pattern")
            explanation = "Risk indicators were detected based on transaction size and category."
            recommended_action = "Verify the transaction independently."
        elif amount > 2500:
            risk_score = 45
            risk_level = RiskLevel.MEDIUM
            signals.append("Elevated transaction value")
            explanation = "Transaction exceeds typical average threshold for this category."
            recommended_action = "Perform automated step-up confirmation or SMS verification."
        else:
            risk_score = 15
            risk_level = RiskLevel.LOW
            signals.append("Standard transaction parameters")
            explanation = "Transaction parameters conform to standard baseline patterns."
            recommended_action = "Allow transaction to proceed with standard monitoring."

        analyzed_at = datetime.now(timezone.utc)

        # Enforce boundary check
        if risk_score < 0 or risk_score > 100:
            raise InvalidRiskScoreError(f"Calculated risk score {risk_score} is out of bounds (0-100).")

        return RiskAnalysisResponse(
            transaction_id=txn_id,
            risk_score=risk_score,
            risk_level=risk_level,
            detected_signals=signals,
            explanation=explanation,
            recommended_action=recommended_action,
            analysis_method=AnalysisMethod.RULE_BASED.value,
            analyzed_at=analyzed_at,
        )
    except InvalidRiskScoreError:
        raise
    except Exception as exc:
        logger.error(f"Error in risk analysis engine: {exc}", exc_info=True)
        raise RiskEngineError(f"Risk analysis execution failed: {str(exc)}") from exc


# Pluggable reference pointing to the active risk analysis implementation
analyze_transaction: Callable[[TransactionCreate], RiskAnalysisResponse] = baseline_analyze_transaction
