"""Solver API — FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from .dependencies import _queue
from .routers import submissions, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await _queue.close()


app = FastAPI(
    title="Plate Solver Service",
    version="1.1.0",
    root_path="/api/v1",
    lifespan=lifespan,
)

app.include_router(submissions.router)
app.include_router(tasks.router)


@app.get("/healthcheck", tags=["System"])
async def healthcheck():
    return {"status": "ok"}
