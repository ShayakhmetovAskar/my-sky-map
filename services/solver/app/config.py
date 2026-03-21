"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://skymap_user:skymap_password@localhost:5432/skymap_db"

    # MinIO / S3
    minio_endpoint: str = "host.docker.internal:9000"
    minio_access_key: str = "admin"
    minio_secret_key: str = "password"
    minio_bucket: str = "skymap"
    minio_secure: bool = False

    # RabbitMQ
    rabbitmq_host: str = "localhost"
    rabbitmq_port: int = 5672
    rabbitmq_user: str = "guest"
    rabbitmq_pass: str = "guest"
    rabbitmq_queue: str = "solver_tasks"

    # Solver
    solver_backend: str = "online"  # "online" or "local"
    astrometry_api_key: str = ""
    astrometry_api_url: str = "https://nova.astrometry.net/api"

    # Auth (Zitadel)
    zitadel_issuer_url: str = "http://host.docker.internal:8080"
    zitadel_audience: str = ""

    # App
    enable_docs: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
