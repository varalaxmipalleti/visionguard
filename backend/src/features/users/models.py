# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
# pyrefly: ignore [missing-import]
from sqlalchemy.sql import func
from src.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user") # e.g., admin, user
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    reset_token = Column(String, nullable=True, index=True)
    reset_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    api_key = Column(String, unique=True, index=True, nullable=True)


    # Per-user AI Engine Preferences (saved from Settings page)
    settings_confidence = Column(Float, default=0.30, nullable=False, server_default="0.30")
    settings_nms_iou = Column(Float, default=0.40, nullable=False, server_default="0.40")
    settings_gpu_enabled = Column(Boolean, default=True, nullable=False, server_default="true")
    settings_color_space = Column(String, default="YCbCr + HSV (Dual Consensus)", nullable=False, server_default="YCbCr + HSV (Dual Consensus)")

