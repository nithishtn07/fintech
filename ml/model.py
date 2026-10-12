"""ML Model interfaces, predictor abstractions, and artifact lifecycle management."""
import os
from abc import ABC, abstractmethod
from typing import Optional

from ml.exceptions import ModelNotLoadedError, InferenceError
from ml.schemas import (
    MLFeatureVector,
    MLPredictionResult,
    ModelMetadata,
    ModelStatus,
)
from ml.features import FEATURE_NAMES


class BaseMLPredictor(ABC):
    """Abstract Base Class specifying the ML Model Predictor contract."""

    @abstractmethod
    def predict(self, features: MLFeatureVector) -> MLPredictionResult:
        """Execute model inference on an extracted feature vector."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if model weights are loaded and ready for inference."""
        pass

    @abstractmethod
    def get_metadata(self) -> ModelMetadata:
        """Return model metadata, architecture description, and training status."""
        pass


class MLModelManager:
    """Manages model artifact persistence, loading, and runtime availability."""

    def __init__(self, artifact_path: Optional[str] = None):
        self.artifact_path = artifact_path
        self._predictor: Optional[BaseMLPredictor] = None
        self._status: ModelStatus = ModelStatus.NOT_TRAINED

    @property
    def status(self) -> ModelStatus:
        return self._status

    @property
    def is_model_loaded(self) -> bool:
        return self._predictor is not None and self._predictor.is_available()

    def load_model(self, model_path: Optional[str] = None) -> BaseMLPredictor:
        """
        Attempts to load a serialized scikit-learn / ML model artifact.
        
        In Phase 1, no trained model artifact has been trained on real or synthetic datasets.
        Attempts to load a missing model will cleanly raise ModelNotLoadedError.
        """
        target_path = model_path or self.artifact_path
        if not target_path or not os.path.exists(target_path):
            self._status = ModelStatus.NOT_TRAINED
            raise ModelNotLoadedError(
                f"Model artifact not found at '{target_path}'. "
                f"In Phase 1, the model is NOT yet trained. "
                f"Feature extraction and inference interfaces are established for Phase 2."
            )

        try:
            # Placeholder for Phase 2 joblib.load(target_path)
            self._status = ModelStatus.READY
            return self._predictor  # type: ignore
        except Exception as exc:
            self._status = ModelStatus.ERROR
            raise InferenceError(f"Failed to load ML model artifact: {exc}") from exc

    def get_metadata(self) -> ModelMetadata:
        """Returns Phase 1 model governance metadata."""
        return ModelMetadata(
            model_name="FinShield_Scikit_GradientBoosting_Baseline",
            version="0.1.0-phase1-interface",
            status=self._status,
            framework="scikit-learn",
            features=FEATURE_NAMES,
            is_trained=False,
            artifact_path=self.artifact_path,
            metrics={},
            notes="Phase 1 Foundation. Interfaces prepared; model training scheduled for Phase 2.",
        )
