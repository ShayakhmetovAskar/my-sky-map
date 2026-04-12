"""Solver API — FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import auth_guest, submissions, tasks, stars
from .routers import settings as settings_router

app = FastAPI(
    title="Plate Solver Service",
    version="1.1.0",
    root_path="/api/v1",
    docs_url="/docs" if settings.enable_docs else None,
    redoc_url="/redoc" if settings.enable_docs else None,
    openapi_url="/openapi.json" if settings.enable_docs else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_guest.router)
app.include_router(settings_router.router)
app.include_router(submissions.router)
app.include_router(tasks.router)
app.include_router(stars.router)


@app.get("/healthcheck", tags=["System"])
async def healthcheck():
    return {"status": "ok"}
