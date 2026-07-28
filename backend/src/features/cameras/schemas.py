from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CameraBase(BaseModel):
    name: str
    stream_url: str
    location: Optional[str] = None
    is_active: Optional[bool] = True

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    stream_url: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class CameraInDBBase(CameraBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

class CameraResponse(CameraInDBBase):
    pass
