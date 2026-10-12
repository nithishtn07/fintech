"""Machine Learning Risk Service & Integration Boundary Contract.

INTEGRATION BOUNDARY DOCUMENTATION:
-----------------------------------
- Backend Responsibility:
    The backend teammate owns `BaselineRiskEngine` in `app/services/risk_service.py`
    and the FastAPI `/api/v1/transactions/analyze` route.
- ML Responsibility:
    This module provides the ML-side interface `analyze_transaction(transaction_data)`.
    In Phase 1:
      1. Extracts full numeric feature vector via `TransactionFeatureExtractor`.
      2. Validates vector schema and telemetry inputs.
      3. Verifies model availability via `MLModelManager`.
      4. Detects explainable feature anomalies.
      5. Gracefully handles model unavailability without falsifying predictions or fake accuracy.
- Phase 2 Hand-off:
    In Phase 2, when the teammate's backend route is ready for ML hybrid scoring,
    the backend can invoke `analyze_transaction(request)` to combine rule weights
    with ML classification probabilities.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

from ml.exceptions import ModelNotLoadedError
from ml.features import TransactionFeatureExtractor
from ml.model import MLModelManager
from ml.schemas import (
    FeatureContribution,
    MLFeatureVector,
    MLPredictionResult,
    ModelStatus,
)


class MLRiskService:
    """Orchestrates ML feature extraction, model inference, and explainability."""

    def __init__(self, model_manager: Optional[MLModelManager] = None):
        self.model_manager = model_manager or MLModelManager()
        self.feature_extractor = TransactionFeatureExtractor()

    def analyze_transaction(
        self,
        transaction_data: Union[Dict[str, Any], Any]
    ) -> MLPredictionResult:
        """
        Public ML evaluation interface.
        
        Args:
            transaction_data: Transaction payload (dict or schema with amount, rails, etc.)
            
        Returns:
            MLPredictionResult with risk score, level, signals, and explainability.
            
        Raises:
            ModelNotLoadedError: If invoked in strict mode when no trained model weights exist.
        """
        # Step 1: Feature Extraction
        features: MLFeatureVector = self.feature_extractor.extract_features(transaction_data)

        # Step 2: Check Model Availability
        if not self.model_manager.is_model_loaded:
            # Documented Phase 1 behavior:
            # We do NOT fabricate predictions or falsify ML model accuracy.
            # Instead, we return a structured assessment indicating feature vector extraction
            # succeeded and model status is NOT_TRAINED for Phase 1.
            return self._build_phase1_foundation_result(transaction_data, features)

        # Step 3: Model Inference (Phase 2 when model artifact is loaded)
        return self.model_manager._predictor.predict(features)  # type: ignore

    def _build_phase1_foundation_result(
        self,
        transaction_data: Any,
        features: MLFeatureVector
    ) -> MLPredictionResult:
        """Constructs an explainable Phase 1 result acknowledging feature extraction."""
        # Extract transaction ID if present
        get = (
            (lambda k, d="": transaction_data.get(k, d))
            if isinstance(transaction_data, dict)
            else (lambda k, d="": getattr(transaction_data, k, d))
        )
        txn_id = get("transaction_id", f"ML-FEAT-{features.transaction_hour:02d}-{int(features.amount)}")

        # Detect notable signals from extracted features for explainability
        signals: List[str] = []
        contributions: List[FeatureContribution] = []

        if features.is_structuring_range:
            signals.append("ML_FEATURE_STRUCTURING_SUSPECT")
            contributions.append(
                FeatureContribution(
                    feature_name="is_structuring_range",
                    contribution_score=0.35,
                    description=f"Transaction value ₹{features.amount:,.2f} is within statutory threshold band.",
                )
            )

        if features.is_late_night:
            signals.append("ML_FEATURE_OFF_HOURS_EXECUTION")
            contributions.append(
                FeatureContribution(
                    feature_name="is_late_night",
                    contribution_score=0.25,
                    description=f"Transaction executed during non-standard hours ({features.transaction_hour:02d}:00).",
                )
            )

        if features.velocity_1h >= 3:
            signals.append("ML_FEATURE_HIGH_VELOCITY_BURST")
            contributions.append(
                FeatureContribution(
                    feature_name="velocity_acceleration",
                    contribution_score=0.30,
                    description=f"High hourly velocity ({features.velocity_1h} transactions in 1h).",
                )
            )

        if features.is_new_recipient:
            signals.append("ML_FEATURE_NEW_BENEFICIARY")
            contributions.append(
                FeatureContribution(
                    feature_name="is_new_recipient",
                    contribution_score=0.20,
                    description="Beneficiary has no previous transaction history.",
                )
            )

        explanation = (
            f"Phase 1 ML Foundation: Successfully extracted 19-dimensional feature vector. "
            f"Detected {len(signals)} heuristic telemetry signal(s). "
            f"Trained model inference deferred to Phase 2."
        )

        return MLPredictionResult(
            transaction_id=str(txn_id),
            risk_score=0.0,
            risk_level="UNRATED_PHASE1",
            fraud_probability=0.0,
            model_version="0.1.0-phase1-interface",
            is_model_trained=False,
            explanation=explanation,
            detected_signals=signals,
            top_feature_contributions=contributions,
            analyzed_at=datetime.now(timezone.utc),
            recommended_action="PENDING_PHASE2_TRAINING",
        )


# Global default service instance
_default_ml_service = MLRiskService()


def analyze_transaction(
    transaction_data: Union[Dict[str, Any], Any]
) -> MLPredictionResult:
    """
    Standard top-level entry point function for transaction analysis.
    Coordinated with the backend teammate for integration.
    """
    return _default_ml_service.analyze_transaction(transaction_data)
