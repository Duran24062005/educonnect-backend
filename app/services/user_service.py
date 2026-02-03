from sqlalchemy.orm import Session
from app.db.models.user import User
from app.db.models.role import Role
from app.services.auth_service import hash_password, create_access_token
from datetime import datetime


def create_user(db: Session, *, first_name: str, last_name: str, birthdate, document_number: str, email: str, password: str, requested_role: str | None = None, created_by: str | None = None, invitation_code: str | None = None):
    # Determine initial state: if invitation provided, allow active; otherwise pending
    is_active = False
    is_verified = False

    role = None
    if invitation_code:
        role = db.query(Role).filter(Role.name == requested_role).first() if requested_role else None
        is_active = True
        is_verified = True

    user = User(
        email=email,
        hashed_password=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        birthdate=birthdate,
        document_number=document_number,
        is_active=is_active,
        is_verified=is_verified,
        role=role,
        created_at=datetime.utcnow(),
        created_by=created_by,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If active, return token
    token = None
    if user.is_active:
        token = create_access_token({"sub": str(user.id), "role": role.name if role else None})

    return user, token


def get_pending_users(db: Session):
    return db.query(User).filter(User.is_active == False).all()


def approve_user(db: Session, user_id: int, role_name: str, approved_by: str | None = None):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        return None
    user.role = role
    user.is_active = True
    user.is_verified = True
    if role.name == 'admin':
        user.is_admin = True
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": role.name})
    return user, token
