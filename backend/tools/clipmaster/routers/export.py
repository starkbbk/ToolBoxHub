from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os

from database import get_db
from shared.response import error_response
from tools.clipmaster.models.clip import Clip
from tools.clipmaster.services.clip_exporter import export_csv, export_json, export_srt

router = APIRouter()

class ExportRequest(BaseModel):
    format: str # "csv" | "json" | "srt"
    only_approved: bool = False

@router.post("/export/{project_id}")
def export_project_clips(project_id: int, req: ExportRequest, db: Session = Depends(get_db)):
    query = db.query(Clip).filter(Clip.project_id == project_id)
    if req.only_approved:
        query = query.filter(Clip.is_approved == True)
        
    clips = query.order_by(Clip.start_seconds.asc()).all()
    
    if not clips:
        return error_response("No clips found to export")
        
    try:
        if req.format == "csv":
            path = export_csv(clips)
            media_type = "text/csv"
        elif req.format == "json":
            path = export_json(clips)
            media_type = "application/json"
        elif req.format == "srt":
            path = export_srt(clips)
            media_type = "text/plain"
        else:
            return error_response("Invalid format")
            
        return FileResponse(path, media_type=media_type, filename=f"clips_project_{project_id}.{req.format}")
    except Exception as e:
        return error_response(f"Export failed: {str(e)}")
