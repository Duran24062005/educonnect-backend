from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import RegisterUser, Token, UserResponse
from app.config import get_db
from app.services.user_service import create_user
from app.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token)
def register(user_in: RegisterUser, db: Session = Depends(get_db)):
    # Uniqueness checks for email and document
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_doc = db.query(User).filter(User.document_number == user_in.document_number).first()
    if existing_doc:
        raise HTTPException(status_code=400, detail="Document number already registered")

    user, token = create_user(db,
                              first_name=user_in.first_name,
                              last_name=user_in.last_name,
                              birthdate=user_in.birthdate,
                              document_number=user_in.document_number,
                              email=user_in.email,
                              password=user_in.password,
                              requested_role=user_in.requested_role,
                              invitation_code=user_in.invitation_code)
    if not user:
        raise HTTPException(status_code=400, detail="Could not create user")
    if token:
        return {"access_token": token, "token_type": "bearer"}
    # If no token (pending), return a 202 accepted with message
    raise HTTPException(status_code=status.HTTP_202_ACCEPTED, detail="Account pending admin approval")
