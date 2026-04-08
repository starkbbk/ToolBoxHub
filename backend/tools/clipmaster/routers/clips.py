from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from shared.response import success_response, error_response
from tools.clipmaster.models.clip import Clip
from tools.clipmaster.schemas.clip import ClipResponse, ClipUpdate
from tools.clipmaster.utils.time_formatter import timestamp_to_seconds
from tools.clipmaster.services.clipper_service import process_approved_clips

from pydantic import BaseModel

router = APIRouter()

@router.get("/clips/{project_id}", response_model=dict)
def get_clips(
    project_id: int, 
    category: Optional[str] = None, 
    min_confidence: Optional[int] = None, 
    search: Optional[str] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Clip).filter(Clip.project_id == project_id)
    
    if category:
        query = query.filter(Clip.category == category)
    if min_confidence is not None:
        query = query.filter(Clip.confidence >= min_confidence)
    if search:
        query = query.filter(Clip.title.ilike(f"%{search}%") | Clip.reason.ilike(f"%{search}%"))
        
    if sort == "time":
        query = query.order_by(Clip.start_seconds.asc())
    elif sort == "confidence":
        query = query.order_by(Clip.confidence.desc())
    elif sort == "category":
        query = query.order_by(Clip.category.asc())
    else:
        query = query.order_by(Clip.start_seconds.asc())

    clips = query.all()
    # Serialize to dicts for our custom response format
    data = [ClipResponse.model_validate(c).model_dump() for c in clips]
    return success_response(data)

@router.put("/clip/{clip_id}")
def update_clip(clip_id: int, clip_data: ClipUpdate, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        return error_response("Clip not found")

    update_dict = clip_data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(clip, k, v)
        
    if "start_time" in update_dict:
        clip.start_seconds = timestamp_to_seconds(clip.start_time)
    if "end_time" in update_dict:
        clip.end_seconds = timestamp_to_seconds(clip.end_time)

    db.commit()
    db.refresh(clip)
    return success_response(ClipResponse.model_validate(clip).model_dump())

@router.delete("/clip/{clip_id}")
def delete_clip(clip_id: int, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        return error_response("Clip not found")
        
    db.delete(clip)
    db.commit()
    return success_response(None, "Clip deleted")

@router.post("/clips/{project_id}/approve-all")
def approve_all_clips(project_id: int, db: Session = Depends(get_db)):
    updated = db.query(Clip).filter(Clip.project_id == project_id).update({"is_approved": True})
    db.commit()
    return success_response({"count": updated})

class BulkActionRequest(BaseModel):
    clip_ids: List[int]
    action: str

@router.post("/clips/{project_id}/bulk-action")
def bulk_action(project_id: int, req: BulkActionRequest, db: Session = Depends(get_db)):
    query = db.query(Clip).filter(Clip.project_id == project_id, Clip.id.in_(req.clip_ids))
    
    if req.action == "approve":
        updated = query.update({"is_approved": True}, synchronize_session=False)
    elif req.action == "reject":
        updated = query.update({"is_approved": False}, synchronize_session=False)
    elif req.action == "delete":
        updated = query.delete(synchronize_session=False)
    else:
        return error_response("Invalid action")
        
    db.commit()
    return success_response({"affected": updated})

@router.post("/clips/{project_id}/render-clips")
def render_clips(project_id: int, db: Session = Depends(get_db)):
    processed = process_approved_clips(project_id, db)
    return success_response({
        "processed_count": len(processed),
        "clips": [ClipResponse.model_validate(c).model_dump() for c in processed]
    })
