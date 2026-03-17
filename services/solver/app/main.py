"""Solver API — FastAPI application."""

from fastapi import FastAPI

from .routers import submissions, tasks

app = FastAPI(
    title="Plate Solver Service",
    version="1.1.0",
    root_path="/api/v1",
)

app.include_router(submissions.router)
app.include_router(tasks.router)


@app.get("/healthcheck", tags=["System"])
async def healthcheck():
    return {"status": "ok"}
