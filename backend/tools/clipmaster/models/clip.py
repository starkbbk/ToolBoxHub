from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from models.base import Base

class Clip(Base):
    __tablename__ = "clips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    start_time = Column(String(10)) # "HH:MM:SS"
    end_time = Column(String(10)) # "HH:MM:SS"
    start_seconds = Column(Float)
    end_seconds = Column(Float)
    title = Column(String(255))
    category = Column(String(50)) # "highlight", "funny", "emotional", "key_point", "topic_change", "action_item", "quote"
    confidence = Column(Integer) # 0 to 100
    reason = Column(Text)
    is_approved = Column(Boolean, default=False)
    user_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    project = relationship("Project", back_populates="clips")
