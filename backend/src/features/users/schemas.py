# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

VALID_COLOR_SPACES = [
    "YCbCr + HSV (Dual Consensus)",
    "Lab + RGB (Illumination Adaptive)",
    "YCbCr + Lab + HSV (Triple Multi-Space)",
    "Standard RGB (High Speed / Low CPU)",
]

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    # NOTE: role is intentionally NOT accepted from the client request.
    # All new registrations are always created as "user" by the backend.
    # Only an admin can change a user's role via the database directly.

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

class UserInDBBase(UserBase):
    id: int
    role: str  # Read-only output — never set from client request (always forced server-side)
    is_active: bool
    is_verified: bool
    created_at: datetime
    api_key: Optional[str] = None
    # AI Engine preferences
    settings_confidence: Optional[float] = 0.30
    settings_nms_iou: Optional[float] = 0.40
    settings_gpu_enabled: Optional[bool] = True
    settings_color_space: Optional[str] = "YCbCr + HSV (Dual Consensus)"

    model_config = {"from_attributes": True}

class UserResponse(UserInDBBase):
    pass

class UserSettings(BaseModel):
    """Request body for saving user AI engine preferences."""
    confidence: float = 0.30
    nms_iou: float = 0.40
    gpu_enabled: bool = True
    color_space: str = "YCbCr + HSV (Dual Consensus)"

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp_code: str

class ResendOTPRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserListResponse(BaseModel):
    """Response schema for admin user listing endpoint."""
    users: list[UserResponse]
    total: int

