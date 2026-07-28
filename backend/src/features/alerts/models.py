from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from src.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), index=True)
    alert_type = Column(String, index=True) # e.g., 'motion', 'intrusion', 'camera_offline'
    message = Column(String)
    is_resolved = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
