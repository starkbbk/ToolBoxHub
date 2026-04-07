from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from .clip import ClipResponse

class TranscriptResponse(BaseModel):
    id: int
    project_id: int
    full_text: str
    segments: List[Any]
    language: Optional[str]
    word_count: Optional[int]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ProjectBase(BaseModel):
    title: str
    source_type: str
    source_url: Optional[str] = None

class ProjectCreate(ProjectBase):
    file_path: Optional[str] = None
    status: str = "uploading"

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
    audio_path: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    file_path: Optional[str]
    audio_path: Optional[str]
    duration_seconds: Optional[float]
    status: str
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ProjectDetailResponse(ProjectResponse):
    transcript: Optional[TranscriptResponse] = None
    clips: List[ClipResponse] = []
