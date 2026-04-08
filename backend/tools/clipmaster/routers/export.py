from fastapi import APIRouter, Depends, HTTPException, Query
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

@router.get("/export/{project_id}")
def export_project_clips(
    project_id: int, 
    format: str = "csv", 
    only_approved: bool = Query(False), 
    db: Session = Depends(get_db)
):
    query = db.query(Clip).filter(Clip.project_id == project_id)
    if only_approved:
        query = query.filter(Clip.is_approved == True)
        
    clips = query.order_by(Clip.start_seconds.asc()).all()
    
    if not clips:
        # Instead of error response, maybe return empty file or 404
        raise HTTPException(status_code=404, detail="No clips found to export")
        
    try:
        if format == "csv":
            path = export_csv(clips)
            media_type = "text/csv"
        elif format == "json":
            path = export_json(clips)
            media_type = "application/json"
        elif format == "srt":
            path = export_srt(clips)
            media_type = "text/plain"
        else:
            raise HTTPException(status_code=400, detail="Invalid format")
            
        file_name = f"clips_project_{project_id}.{format}"
        if only_approved:
            file_name = f"approved_{file_name}"
            
        return FileResponse(path, media_type=media_type, filename=file_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
