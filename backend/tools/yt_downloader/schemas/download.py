from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ExtractRequest(BaseModel):
    url: str

class FormatInfo(BaseModel):
    format_id: str
    quality_label: str
    extension: str
    fps: Optional[int] = None
    file_size_bytes: Optional[int] = None
    file_size_display: str
    video_codec: Optional[str] = None
    audio_codec: Optional[str] = None
    has_video: bool
    has_audio: bool
    needs_merge: bool
    is_available: bool = True

class VideoInfo(BaseModel):
    video_id: str
    title: str
    channel: str
    thumbnail_url: str
    duration_seconds: float
    duration_formatted: str
    view_count: int
    upload_date: str
    description: str

class ExtractResponse(BaseModel):
    video_info: VideoInfo
    formats: List[FormatInfo]

class DownloadRequest(BaseModel):
    url: str
    format_id: str
    quality_label: str

class DownloadRecord(BaseModel):
    id: int
    video_id: str
    title: str
    channel: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    source_url: str
    selected_quality: str
    file_size_bytes: Optional[int] = None
    file_size_display: str
    file_extension: str
    status: str
    progress_percent: int
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
