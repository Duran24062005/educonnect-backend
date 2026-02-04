"""
Configuración central de la aplicación EduConnect
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    """Configuración de la aplicación"""
    
    # Información de la aplicación
    PROJECT_NAME: str = "EduConnect API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Seguridad
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production-please")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 días
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 días
    
    # Base de datos
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://neondb_owner:npg_9Qs7oAfWRcpT@ep-aged-wind-ah9ptwdr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["*"]
    
    # Timezone para Colombia
    TIMEZONE: str = "America/Bogota"
    
    # Email (para futuras implementaciones)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Entorno
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()