"""
Configuración central de la aplicación EduConnect
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List


class Settings(BaseSettings):
    """Configuración de la aplicación"""

    # Información de la aplicación
    PROJECT_NAME: str = "EduConnect API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # Seguridad
    SECRET_KEY: str = "change-me-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7      # 7 días
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30   # 30 días

    # Base de datos
    DATABASE_URL: str

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # Timezone
    TIMEZONE: str = "America/Bogota"

    # Email (futuro)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None

    # Entorno
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # ✅ Pydantic v2 ONLY
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=True
    )


settings = Settings()
