from sqlalchemy import Column, Integer, Text, JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from models.base import Base

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    full_text = Column(Text, nullable=False)
    segments = Column(JSON) # array of {start: "HH:MM:SS", end: "HH:MM:SS", text: string}
    language = Column(String(10))
    word_count = Column(Integer)
    created_at = Column(DateTime, default=func.now())

    project = relationship("Project", back_populates="transcript")
