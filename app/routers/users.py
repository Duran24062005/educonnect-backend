from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/pending")
def list_pending_users():
    return {"token": "User approved endpoint - to be implemented|"}

@router.post("/{user_id}/approve")
def approve():
    return {"token": "User approved endpoint - to be implemented|"}
