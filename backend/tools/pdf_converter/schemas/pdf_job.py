from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any

class PDFJobBase(BaseModel):
    title: str
    job_type: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class PDFJobCreate(PDFJobBase):
    original_file_path: Optional[str] = None

class PDFJobUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    output_path: Optional[str] = None
    error_message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    duration_seconds: Optional[float] = None
    page_count: Optional[int] = None

class PDFJobResponse(PDFJobBase):
    id: int
    status: str
    original_file_path: Optional[str] = None
    output_path: Optional[str] = None
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
    page_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
