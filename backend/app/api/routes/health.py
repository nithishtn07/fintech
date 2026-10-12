"""Health check endpoint."""
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health():
    """Return application name, health status, and operational metadata."""
    return {
        "application_name": settings.PROJECT_NAME,
        "status": "healthy",
        "message": "FinShield AI Fraud Detection Service is operational",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }
