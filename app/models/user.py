"""
Modelo de Usuario
"""
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class User(Base):
    """
    Modelo de usuario del sistema
    Soporta diferentes roles: estudiante, docente, administrador, acudiente
    """
    __tablename__ = "users"
    
    # Identificación
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Información personal
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    birthdate = Column(Date, nullable=False)
    document_type = Column(String(10), default="CC")  # CC, TI, CE, etc.
    document_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Estados
    is_active = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    
    # Rol
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=True)
    role = relationship("Role", back_populates="users")
    
    # Información adicional para estudiantes
    student_code = Column(String(50), nullable=True, unique=True, index=True)
    grade_level = Column(String(20), nullable=True)  # Ej: "5to", "9no"
    section = Column(String(10), nullable=True)  # Ej: "A", "B"
    
    # Información adicional para docentes
    teacher_code = Column(String(50), nullable=True, unique=True, index=True)
    specialization = Column(String(100), nullable=True)  # Ej: "Matemáticas"
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(String(255), nullable=True)
    
    # Información de verificación
    verification_token = Column(String(255), nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    
    # Reseteo de contraseña
    reset_password_token = Column(String(255), nullable=True)
    reset_password_expires = Column(DateTime, nullable=True)
    
    # Metadata adicional (JSON para flexibilidad)
    metadata_json = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role.name if self.role else None}')>"
    
    @property
    def full_name(self):
        """Nombre completo del usuario"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_student(self):
        """Verificar si el usuario es estudiante"""
        return self.role and self.role.name == "student"
    
    @property
    def is_teacher(self):
        """Verificar si el usuario es docente"""
        return self.role and self.role.name == "teacher"
    
    @property
    def is_guardian(self):
        """Verificar si el usuario es acudiente"""
        return self.role and self.role.name == "guardian"
