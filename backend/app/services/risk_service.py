"""Explainable baseline rule-based risk engine for transaction analysis.

NOTE: This is a transparent, deterministic rule-based baseline engine for Phase 1,
NOT a trained machine learning model.
"""
from datetime import datetime, timezone
import uuid
from typing import Dict, List, Tuple
from app.schemas.transaction import (
    TransactionAnalyzeRequest,
    TransactionAnalyzeResponse,
    SignalDetail,
)


def generate_synthetic_recipient_id() -> str:
    """Generate a realistic synthetic recipient identifier."""
    hex_suffix = uuid.uuid4().hex[:8].upper()
    return f"REC-{hex_suffix}-IN"


def generate_transaction_id() -> str:
    """Generate a unique transaction identifier."""
    return f"TXN-{uuid.uuid4().hex[:12].upper()}"


class BaselineRiskEngine:
    """Deterministic, explainable rule-based risk evaluation engine."""

    VERSION = "RULE_BASED_BASELINE"

    @classmethod
    def evaluate(
        cls,
        request: TransactionAnalyzeRequest
    ) -> TransactionAnalyzeResponse:
        signals: List[str] = []
        signal_details: List[SignalDetail] = []
        score = 8.0  # Base natural baseline score
        
        amount = request.amount
        txn_type = request.transaction_type.upper()
        pay_method = request.payment_method.upper()
        recipient_id = request.recipient_id or generate_synthetic_recipient_id()
        is_new_recip = bool(request.is_new_recipient)
        
        # Determine hour: from request field or timestamp or default to normal daylight
        hour = request.transaction_hour
        if hour is None and request.timestamp:
            hour = request.timestamp.hour
        if hour is None:
            # Use current UTC or standard daylight hour
            hour = datetime.now(timezone.utc).hour

        velocity_1h = request.velocity_1h if request.velocity_1h is not None else 0
        velocity_24h = request.velocity_24h if request.velocity_24h is not None else velocity_1h

        # -------------------------------------------------------------
        # Rule 1: Regulatory Structuring / Threshold Evasion Detection
        # (Amounts intentionally hovering just under 50k or 100k limits)
        # -------------------------------------------------------------
        if (49000 <= amount <= 49999) or (99000 <= amount <= 99999):
            points = 18.0
            score += points
            sig_name = "STRUCTURING_THRESHOLD_EVASION_SUSPECT"
            signals.append(sig_name)
            signal_details.append(
                SignalDetail(
                    code=sig_name,
                    title="Potential Structuring Pattern",
                    description=f"Transaction amount ₹{amount:,.2f} is positioned just below statutory reporting thresholds.",
                    severity="WARNING",
                    points=points,
                )
            )

        # -------------------------------------------------------------
        # Rule 2: High Amount in Context
        # Note: High amount alone does NOT mean fraud!
        # E.g. Verified merchant or utility bill has lower weight than unverified P2P.
        # -------------------------------------------------------------
        if amount >= 150000:
            if txn_type in ["P2P", "CASH_WITHDRAWAL"]:
                points = 24.0
                sig_name = "HIGH_VALUE_UNSECURED_TRANSFER"
                desc = f"Large sum (₹{amount:,.2f}) initiated via peer-to-peer transfer."
            else:
                points = 10.0
                sig_name = "ELEVATED_MERCHANT_VOLUME"
                desc = f"Substantial transaction value (₹{amount:,.2f}) processed via {pay_method}."
            score += points
            signals.append(sig_name)
            signal_details.append(
                SignalDetail(
                    code=sig_name,
                    title="Elevated Transaction Amount",
                    description=desc,
                    severity="INFO" if points <= 10 else "WARNING",
                    points=points,
                )
            )
        elif amount >= 50000:
            if txn_type == "P2P" and is_new_recip:
                points = 16.0
                sig_name = "MODERATE_HIGH_P2P_NEW_BENEFICIARY"
                score += points
                signals.append(sig_name)
                signal_details.append(
                    SignalDetail(
                        code=sig_name,
                        title="Significant Transfer to New Recipient",
                        description=f"Transfer of ₹{amount:,.2f} routed to newly observed recipient {recipient_id}.",
                        severity="WARNING",
                        points=points,
                    )
                )

        # -------------------------------------------------------------
        # Rule 3: Velocity & Burst Frequency Checks
        # -------------------------------------------------------------
        if velocity_1h >= 5:
            points = 26.0
            score += points
            sig_name = "EXTREME_BURST_VELOCITY_1H"
            signals.append(sig_name)
            signal_details.append(
                SignalDetail(
                    code=sig_name,
                    title="Extreme Burst Frequency (1 Hour)",
                    description=f"{velocity_1h} transactions initiated in past hour exceeds rapid-burst velocity threshold.",
                    severity="CRITICAL",
                    points=points,
                )
            )
        elif velocity_1h >= 3:
            points = 12.0
            score += points
            sig_name = "ELEVATED_VELOCITY_1H"
            signals.append(sig_name)
            signal_details.append(
                SignalDetail(
                    code=sig_name,
                    title="Elevated Short-Term Velocity",
                    description=f"{velocity_1h} transactions within 60 minutes indicates active payment sequence.",
                    severity="WARNING",
                    points=points,
                )
            )

        if velocity_24h >= 12:
            points = 15.0
            score += points
            sig_name = "HIGH_DAILY_TRANSACTION_COUNT"
            signals.append(sig_name)
            signal_details.append(
                SignalDetail(
                    code=sig_name,
                    title="High 24-Hour Transaction Frequency",
                    description=f"Account has performed {velocity_24h} transactions in the last 24 hours.",
                    severity="WARNING",
                    points=points,
                )
            )

        # -------------------------------------------------------------
        # Rule 4: Temporal / Off-Hours Anomaly
        # Late night window (01:00 to 04:59) is common for automated draining
        # -------------------------------------------------------------
        is_late_night = (1 <= hour <= 4)
        if is_late_night:
            if is_new_recip or velocity_1h >= 2 or txn_type == "P2P":
                points = 22.0
                severity = "CRITICAL"
                sig_name = "UNUSUAL_OFF_HOURS_HIGH_RISK_ACTIVITY"
                desc = f"Transaction initiated during non-standard hours ({hour:02d}:00) coupled with high-risk transfer attributes."
            else:
                points = 8.0
                severity = "INFO"
                sig_name = "OFF_HOURS_ACTIVITY"
                desc = f"Transaction occurred during early morning hours ({hour:02d}:00)."
            score += points
            signals.append(sig_name)
            signal_details.append(
                SignalDetail(
                    code=sig_name,
                    title="Off-Hours Payment Execution",
                    description=desc,
                    severity=severity,
                    points=points,
                )
            )

        # -------------------------------------------------------------
        # Rule 5: New Recipient / First Time Beneficiary
        # -------------------------------------------------------------
        if is_new_recip:
            points = 12.0
            score += points
            sig_name = "NEW_BENEFICIARY_INTERACTION"
            signals.append(sig_name)
            signal_details.append(
                SignalDetail(
                    code=sig_name,
                    title="First-Time Recipient Interaction",
                    description=f"Target recipient {recipient_id} has no established historical transaction record with sender.",
                    severity="INFO",
                    points=points,
                )
            )

        # -------------------------------------------------------------
        # Rule 6: Channel / Payment Method Risk Combinations
        # -------------------------------------------------------------
        if txn_type in ["INTERNATIONAL", "CROSS_BORDER"]:
            points = 20.0
            score += points
            sig_name = "CROSS_BORDER_RAIL"
            signals.append(sig_name)
            signal_details.append(
                SignalDetail(
                    code=sig_name,
                    title="Cross-Border Transaction Rails",
                    description="Cross-border payment channel subject to higher dispute and chargeback rates.",
                    severity="WARNING",
                    points=points,
                )
            )

        # -------------------------------------------------------------
        # Rule 7: Compound Risk Multiplier
        # Multiple simultaneous red flags compound exponentially in fraud
        # -------------------------------------------------------------
        if is_late_night and is_new_recip and (velocity_1h >= 2 or amount >= 25000):
            compound_points = 18.0
            score += compound_points
            sig_name = "COMPOUND_HIGH_RISK_PROFILE"
            signals.append(sig_name)
            signal_details.append(
                SignalDetail(
                    code=sig_name,
                    title="Compound Multi-Vector Threat Vector",
                    description="Coincidence of off-hours timing, new unverified beneficiary, and elevated velocity/amount strongly correlates with account takeover or coercive scam.",
                    severity="CRITICAL",
                    points=compound_points,
                )
            )

        # Bound score between 0.0 and 100.0
        final_score = min(max(round(score, 1), 0.0), 100.0)

        # Determine Risk Level and Recommended Action
        if final_score <= 35.0:
            risk_level = "LOW"
            recommended_action = "ALLOW"
            action_desc = "Authorize transaction. Standard background telemetry monitoring applies."
        elif final_score <= 70.0:
            risk_level = "MEDIUM"
            recommended_action = "STEP_UP_AUTH"
            action_desc = "Challenge sender with Step-up Biometric or in-app OTP authentication before fund release."
        else:
            risk_level = "HIGH"
            recommended_action = "HOLD_FOR_REVIEW"
            action_desc = "Hold transaction in quarantine. Enforce 30-minute delay and notify fraud operations desk."

        # Generate Explainable Synthesis
        explanation = cls._generate_explanation(
            amount=amount,
            currency=request.currency,
            risk_level=risk_level,
            final_score=final_score,
            signals=signals,
            signal_details=signal_details,
            action_desc=action_desc,
        )

        analyzed_at = datetime.now(timezone.utc)
        transaction_id = generate_transaction_id()

        return TransactionAnalyzeResponse(
            transaction_id=transaction_id,
            amount=amount,
            currency=request.currency,
            transaction_type=request.transaction_type,
            payment_method=request.payment_method,
            recipient_id=recipient_id,
            risk_score=final_score,
            risk_level=risk_level,
            detected_signals=signals,
            signal_details=signal_details,
            explanation=explanation,
            recommended_action=recommended_action,
            analyzed_at=analyzed_at,
            analysis_method=cls.VERSION,
        )

    @classmethod
    def _generate_explanation(
        cls,
        amount: float,
        currency: str,
        risk_level: str,
        final_score: float,
        signals: List[str],
        signal_details: List[SignalDetail],
        action_desc: str,
    ) -> str:
        if not signals:
            return (
                f"Assessed as {risk_level} Risk (Score: {final_score}/100). "
                f"Transaction amount of {currency} {amount:,.2f} operates within standard behavioral parameters with no anomalous velocity, timing, or beneficiary indicators. "
                f"Recommendation: {action_desc} (Evaluated via FinShield AI Deterministic Baseline Engine)."
            )

        top_factors = [d.title for d in signal_details[:3]]
        factors_str = ", ".join(top_factors)
        return (
            f"Assessed as {risk_level} Risk (Score: {final_score}/100) triggering {len(signals)} rule indicator(s). "
            f"Primary risk drivers: {factors_str}. "
            f"Recommendation: {action_desc} (Evaluated via FinShield AI Deterministic Baseline Engine)."
        )
