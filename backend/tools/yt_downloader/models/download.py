from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from models.base import Base

class YTDownload(Base):
    __tablename__ = "yt_downloads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String(20), nullable=False)
    title = Column(String(500), nullable=False)
    channel = Column(String(255), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    source_url = Column(String(500), nullable=False)
    selected_quality = Column(String(20), nullable=False) # e.g., "2160p", "1080p", "audio"
    selected_format_id = Column(String(100), nullable=True) # yt-dlp format ID
    file_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    file_extension = Column(String(10), default="mp4")
    status = Column(String(20), default="extracting") # extracting, downloading, merging, completed, failed
    progress_percent = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
