import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import SessionLocal
from app.routers import (
    health,
    auth,
    admin_requisitions,
    public_jobs,
    profile,
    files,
    candidate_applications,
    admin_notifications,
    admin_applications,
)

from app.services.bootstrap import init_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Run bootstrap / seed if DB is available
    try:
        import app.models  # noqa: F401
        from app.core.database import Base, engine
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            init_db(db)
            logger.info("Database bootstrap and seed completed successfully.")
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Database bootstrap skipped on startup: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        settings.PUBLIC_BASE_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    field_errors = {}
    for err in exc.errors():
        loc = ".".join(str(l) for l in err.get("loc", []) if l != "body")
        field_errors[loc or "payload"] = err.get("msg", "Invalid value")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Input validation failed",
                    "fields": field_errors,
                }
            }
        },
    )


# Direct root /health endpoint for Docker healthcheck and root monitoring
@app.get("/health", tags=["Health"])
def root_health():
    return {"status": "ok"}


# API v1 routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(admin_requisitions.router, prefix=settings.API_V1_STR)
app.include_router(public_jobs.router, prefix=settings.API_V1_STR)
app.include_router(profile.router, prefix=settings.API_V1_STR)
app.include_router(files.router, prefix=settings.API_V1_STR)
app.include_router(candidate_applications.router, prefix=settings.API_V1_STR)
app.include_router(admin_notifications.router, prefix=settings.API_V1_STR)
app.include_router(admin_applications.router, prefix=settings.API_V1_STR)





@app.get("/", tags=["Root"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
    }
