"""
Modelos de base de datos
"""
from app.db.models.user import User
from app.db.models.role import Role

__all__ = ["User", "Role"]