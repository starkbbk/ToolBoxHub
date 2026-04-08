from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from models.base import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    source_type = Column(String(20)) # "upload" or "youtube"
    source_url = Column(String(500), nullable=True)
    file_path = Column(String(500), nullable=True)
    audio_path = Column(String(500), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    status = Column(String(20), default="uploading")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    transcript = relationship("Transcript", back_populates="project", uselist=False, cascade="all, delete-orphan")
    clips = relationship("Clip", back_populates="project", cascade="all, delete-orphan")
