"""Solver API — FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import submissions, tasks

app = FastAPI(
    title="Plate Solver Service",
    version="1.1.0",
    root_path="/api/v1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://localhost:8889",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(submissions.router)
app.include_router(tasks.router)


@app.get("/healthcheck", tags=["System"])
async def healthcheck():
    return {"status": "ok"}
