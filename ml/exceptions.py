"""Domain-specific exceptions for FinShield AI ML Risk Module."""


class MLRiskError(Exception):
    """Base exception for all machine-learning risk module errors."""
    pass


class ModelNotLoadedError(MLRiskError):
    """Raised when an inference request is dispatched but no trained model artifact is loaded."""
    def __init__(self, message: str = "No trained ML model artifact is loaded in Phase 1."):
        super().__init__(message)


class FeatureExtractionError(MLRiskError):
    """Raised when feature extraction fails due to malformed or incompatible transaction data."""
    pass


class InferenceError(MLRiskError):
    """Raised when the model fails during vector evaluation or probability calculation."""
    pass
