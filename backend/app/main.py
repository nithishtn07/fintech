"""FinShield AI - FastAPI Main Application Entrypoint.

Developed by Member 2 (Backend API Developer) for FinShield AI hackathon.
Connects Frontend, ML Risk Engine, Detection Rules, and Persistence Layer.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
from app.schemas.transaction import HealthResponse

# Configure structured logging without sensitive transaction fields
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
)
logger = logging.getLogger("finshield.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown procedures."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    logger.info(f"Allowed CORS Origins: {settings.ALLOWED_ORIGINS}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "FinShield AI — Real-time transaction fraud-risk analysis backend API. "
        "Coordinates incoming transaction validation, risk scoring, and data persistence."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration for Frontend dev origins (Member 1)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["system"],
    summary="API Health Check",
    description="Confirms that the FastAPI server is running and accessible.",
)
def health_check() -> HealthResponse:
    """Returns basic service health status without falsely claiming dependency readiness."""
    return HealthResponse(
        status="ok",
        service="FinShield AI API",
    )


# Mount versioned API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
