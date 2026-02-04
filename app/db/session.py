"""
Configuración de base de datos con SQLAlchemy
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os

from app.core.config import settings

# Crear engine
# Usar NullPool para serverless (Vercel) para evitar problemas de conexión
is_serverless = "vercel" in os.getenv("VERCEL_ENV", "").lower()

engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool if is_serverless else None,
    echo=settings.DEBUG,
    pool_pre_ping=True,  # Verificar conexiones antes de usar
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base para modelos
Base = declarative_base()


def get_db():
    """
    Dependency para obtener sesión de base de datos
    Uso: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()