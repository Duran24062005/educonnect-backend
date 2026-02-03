from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.user_service import get_pending_users, approve_user
from app.schemas.user import UserResponse, Token

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/pending", response_model=list[UserResponse])
def list_pending(db: Session = Depends(get_db)):
    users = get_pending_users(db)
    return users

@router.post("/{user_id}/approve", response_model=Token)
def approve(user_id: int, role: str, db: Session = Depends(get_db)):
    res = approve_user(db, user_id=user_id, role_name=role)
    if not res:
        raise HTTPException(status_code=404, detail="User or role not found")
    user, token = res
    return {"access_token": token, "token_type": "bearer"}
