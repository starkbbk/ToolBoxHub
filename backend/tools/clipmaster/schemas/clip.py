from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ClipBase(BaseModel):
    start_time: str
    end_time: str
    title: str
    category: str
    confidence: int
    reason: str
    is_approved: bool = False
    file_path: Optional[str] = None
    user_notes: Optional[str] = None

class ClipCreate(ClipBase):
    start_seconds: float
    end_seconds: float

class ClipUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    is_approved: Optional[bool] = None
    user_notes: Optional[str] = None

class ClipResponse(ClipBase):
    id: int
    project_id: int
    start_seconds: float
    end_seconds: float
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
