from pydantic import BaseModel

class RoleBase(BaseModel):
    name: str
    description: str | None = None

class RoleCreate(RoleBase):
    pass

class RoleRead(RoleBase):
    id: int
    is_active: bool
