from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Candidate Sourcing System API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/candidate_sourcing"

    # Security / Auth
    SECRET_KEY: str = "dev_secret_key_for_testing_and_local_development_123456789"
    ACCESS_TOKEN_TTL_MIN: int = 15
    REFRESH_TOKEN_TTL_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Storage
    UPLOAD_DIR: str = "./data/uploads"

    # SMTP / Mailer
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_FROM: str = "noreply@talentbridge.local"

    # Bootstrap Admin
    ADMIN_EMAIL: str = "admin@talentbridge.local"
    ADMIN_PASSWORD: str = "Admin@12345"

    # URLs & CORS
    PUBLIC_BASE_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "*"
    NEXT_PUBLIC_API_BASE: Optional[str] = None


settings = Settings()
