from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from src.core.database import Base

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), index=True)
    timestamp = Column(DateTime(timezone=True), index=True)
    motion_count = Column(Integer, default=0)
    person_count = Column(Integer, default=0)
    vehicle_count = Column(Integer, default=0)
    avg_fps = Column(Float, default=0.0)
