"""Unit tests for FinShield AI Phase 1 ML Foundation."""
import pytest
from ml.exceptions import FeatureExtractionError, ModelNotLoadedError
from ml.features import TransactionFeatureExtractor, FEATURE_NAMES
from ml.model import MLModelManager
from ml.schemas import ModelStatus
from ml.service import MLRiskService, analyze_transaction


def test_feature_extraction_valid_payload():
    """Verify standard transaction extracts all 19 features accurately."""
    payload = {
        "amount": 2500.0,
        "currency": "INR",
        "transaction_type": "P2P",
        "payment_method": "UPI",
        "transaction_hour": 14,
        "velocity_1h": 2,
        "velocity_24h": 6,
        "recipient_id": "REC-DEMO-001",
        "is_new_recipient": False,
    }
    features = TransactionFeatureExtractor.extract_features(payload)

    assert features.amount == 2500.0
    assert features.amount_log > 0
    assert features.is_structuring_range == 0
    assert features.transaction_hour == 14
    assert features.is_late_night == 0
    assert features.velocity_1h == 2
    assert features.velocity_24h == 6
    assert features.is_new_recipient == 0
    assert features.rail_upi == 1
    assert features.rail_credit_card == 0
    assert features.type_p2p == 1
    assert features.type_merchant == 0

    # Verify array export length matches FEATURE_NAMES
    arr = features.to_array()
    assert len(arr) == len(FEATURE_NAMES)
    assert len(arr) == 19


def test_structuring_and_off_hours_detection():
    """Verify structuring amount band (49k-50k) and late night hour are flagged."""
    payload = {
        "amount": 49850.0,
        "transaction_type": "P2P",
        "payment_method": "UPI",
        "transaction_hour": 2,  # 02:00 late night
        "velocity_1h": 5,
        "velocity_24h": 10,
        "is_new_recipient": True,
    }
    features = TransactionFeatureExtractor.extract_features(payload)

    assert features.is_structuring_range == 1
    assert features.is_late_night == 1
    assert features.is_new_recipient == 1
    assert features.velocity_1h == 5


def test_missing_amount_raises_error():
    """Verify missing amount raises FeatureExtractionError."""
    payload = {
        "transaction_type": "P2P",
        "payment_method": "UPI",
    }
    with pytest.raises(FeatureExtractionError) as exc_info:
        TransactionFeatureExtractor.extract_features(payload)
    assert "amount" in str(exc_info.value).lower()


def test_negative_or_zero_amount_raises_error():
    """Verify negative or zero amount is rejected."""
    with pytest.raises(FeatureExtractionError):
        TransactionFeatureExtractor.extract_features({"amount": -100.0})

    with pytest.raises(FeatureExtractionError):
        TransactionFeatureExtractor.extract_features({"amount": 0.0})


def test_model_manager_missing_model_raises_cleanly():
    """Verify loading non-existent model artifact raises ModelNotLoadedError."""
    manager = MLModelManager(artifact_path="non_existent_weights.joblib")
    assert manager.status == ModelStatus.NOT_TRAINED
    assert not manager.is_model_loaded

    with pytest.raises(ModelNotLoadedError) as exc_info:
        manager.load_model()
    assert "not found" in str(exc_info.value).lower()


def test_model_metadata_reports_not_trained_honestly():
    """Verify Phase 1 metadata does not fake accuracy or claim trained model."""
    manager = MLModelManager()
    meta = manager.get_metadata()

    assert meta.is_trained is False
    assert meta.framework == "scikit-learn"
    assert len(meta.features) == 19
    assert meta.metrics == {}  # Empty metrics in Phase 1


def test_analyze_transaction_service_flow():
    """Verify analyze_transaction produces structured explainable result."""
    payload = {
        "amount": 49500.0,
        "transaction_type": "P2P",
        "payment_method": "UPI",
        "transaction_hour": 3,
        "velocity_1h": 4,
        "is_new_recipient": True,
    }
    result = analyze_transaction(payload)

    assert result is not None
    assert result.is_model_trained is False
    assert result.model_version == "0.1.0-phase1-interface"
    assert len(result.detected_signals) > 0
    assert "ML_FEATURE_STRUCTURING_SUSPECT" in result.detected_signals
    assert "ML_FEATURE_OFF_HOURS_EXECUTION" in result.detected_signals
    assert "ML_FEATURE_HIGH_VELOCITY_BURST" in result.detected_signals
    assert "ML_FEATURE_NEW_BENEFICIARY" in result.detected_signals
    assert len(result.top_feature_contributions) >= 3


def test_analyze_transaction_with_object_attributes():
    """Verify feature extractor handles objects with attribute access as well as dicts."""
    class DummyTxn:
        amount = 500.0
        transaction_type = "MERCHANT"
        payment_method = "CREDIT_CARD"
        transaction_hour = 12
        velocity_1h = 1
        velocity_24h = 2
        is_new_recipient = False

    service = MLRiskService()
    result = service.analyze_transaction(DummyTxn())
    assert result.is_model_trained is False
    assert "ML Foundation" in result.explanation
