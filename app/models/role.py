"""
Modelo de Rol de Usuario
"""
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class Role(Base):
    """
    Roles disponibles en el sistema:
    - student: Estudiante
    - teacher: Docente
    - admin: Administrador
    - guardian: Padre/Acudiente
    """
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Relaciones
    users = relationship("User", back_populates="role")
    
    def __repr__(self):
        return f"<Role(id={self.id}, name='{self.name}')>"
