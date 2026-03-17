"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://skymap_user:skymap_password@localhost:5432/skymap_db"

    # MinIO / S3
    minio_endpoint: str = "localhost:9000"
    minio_external_endpoint: str = ""
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

    # JWT
    jwt_public_key: str = ""
    jwt_algorithm: str = "RS256"

    class Config:
        env_file = ".env"


settings = Settings()
