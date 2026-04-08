from sqlalchemy import Column, Integer, String, JSON, DateTime, Float, Text
from datetime import datetime
from models.base import Base

class PDFJob(Base):
    __tablename__ = "pdf_jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    original_file_path = Column(String(500), nullable=True)
    output_path = Column(String(500), nullable=True)
    
    # "uploaded", "processing", "completed", "failed"
    status = Column(String(20), default="uploaded")
    job_type = Column(String(50), nullable=True) # "to-text", "to-images", "merge", "split"
    
    duration_seconds = Column(Float, nullable=True)
    page_count = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Store settings used for the job or result metadata
    details = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
