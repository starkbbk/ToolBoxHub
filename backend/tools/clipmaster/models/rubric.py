from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from backend.models.base import Base

class Rubric(Base):
    __tablename__ = "rubrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255))
    description = Column(Text, nullable=True)
    rules = Column(JSON) # array of rule strings
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
