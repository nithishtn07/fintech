"""FinShield AI — Machine Learning Risk Foundation (Phase 1)

This package defines the modular machine-learning architecture for Phase 1.
NOTE: In accordance with Phase 1 project guidelines, no fictitious ML model
weights or falsified test accuracy are bundled. Phase 1 provides the complete,
testable feature extraction pipeline, prediction schemas, model loading
interfaces, and integration boundaries for the Phase 2 trained model.
"""

from ml.exceptions import (
    MLRiskError,
    ModelNotLoadedError,
    FeatureExtractionError,
    InferenceError,
)
from ml.schemas import (
    MLFeatureVector,
    MLPredictionResult,
    ModelMetadata,
    ModelStatus,
)
from ml.features import TransactionFeatureExtractor
from ml.model import BaseMLPredictor, MLModelManager
from ml.service import MLRiskService, analyze_transaction

__all__ = [
    "MLRiskError",
    "ModelNotLoadedError",
    "FeatureExtractionError",
    "InferenceError",
    "MLFeatureVector",
    "MLPredictionResult",
    "ModelMetadata",
    "ModelStatus",
    "TransactionFeatureExtractor",
    "BaseMLPredictor",
    "MLModelManager",
    "MLRiskService",
    "analyze_transaction",
]
