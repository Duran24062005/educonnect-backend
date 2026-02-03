from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    birthdate = Column(Date, nullable=False)
    document_number = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=True)

    role = relationship('Role')

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, nullable=True)
