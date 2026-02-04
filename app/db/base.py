"""
Base de datos - Importar todos los modelos para que Alembic los detecte
"""
from app.db.session import Base

# Importar todos los modelos aquí para que Alembic los detecte
from app.db.models.user import User
from app.db.models.role import Role

__all__ = ["Base", "User", "Role"]