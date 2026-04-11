from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import os
import shutil
from typing import List

from database import get_db
from shared.response import success_response
from ..models.download import YTDownload
from ..schemas.download import ExtractRequest, ExtractResponse, DownloadRequest, DownloadRecord, DownloadRecord as DownloadRecordSchema
from ..services.extractor import extract_video_info
from ..services.downloader import download_video
from ..utils.format_helpers import format_file_size
from config import settings

router = APIRouter()

@router.post("/extract", response_model=None)
async def extract(request: ExtractRequest):
    try:
        data = await extract_video_info(request.url)
        return success_response(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/download", response_model=None)
async def start_download(
    request: DownloadRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        # 1. Get info again to populate DB record
        info = await extract_video_info(request.url)
        video_info = info["video_info"]
        
        # 2. Create DB record
        download_record = YTDownload(
            video_id=video_info["video_id"],
            title=video_info["title"],
            channel=video_info["channel"],
            thumbnail_url=video_info["thumbnail_url"],
            duration_seconds=video_info["duration_seconds"],
            source_url=request.url,
            selected_quality=request.quality_label,
            selected_format_id=request.format_id,
            status="downloading"
        )
        db.add(download_record)
        db.commit()
        db.refresh(download_record)
        
        # 3. Start background task
        output_dir = os.path.join(settings.upload_dir, "yt_downloader")
        background_tasks.add_task(
            download_video,
            db, # This might be problematic with threads, but downloader handles it or we'll solve it
            download_record.id,
            request.url,
            request.format_id,
            request.quality_label,
            output_dir
        )
        
        return success_response({"download_id": download_record.id})
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/download/{download_id}/status")
async def get_status(download_id: int, db: Session = Depends(get_db)):
    record = db.query(YTDownload).filter(YTDownload.id == download_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Download not found")
        
    return success_response({
        "status": record.status,
        "progress_percent": record.progress_percent,
        "file_size_bytes": record.file_size_bytes,
        "error_message": record.error_message
    })

@router.get("/download/{download_id}/file")
async def get_file(download_id: int, db: Session = Depends(get_db)):
    record = db.query(YTDownload).filter(YTDownload.id == download_id).first()
    if not record or record.status != "completed":
        raise HTTPException(status_code=404, detail="File not ready or not found")
        
    if not record.file_path or not os.path.exists(record.file_path):
        raise HTTPException(status_code=404, detail="File has been deleted from server")

    def iterfile():
        with open(record.file_path, mode="rb") as file_like:
            yield from file_like

    filename = os.path.basename(record.file_path)
    content_type = "video/mp4" if record.selected_quality != "audio" else "audio/mpeg"
    
    return StreamingResponse(
        iterfile(), 
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
    )

@router.get("/history", response_model=None)
async def get_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    records = db.query(YTDownload).order_by(YTDownload.created_at.desc()).limit(limit).offset(offset).all()
    
    # Map to schema-friendly dicts
    history = []
    for r in records:
        history.append({
            "id": r.id,
            "video_id": r.video_id,
            "title": r.title,
            "channel": r.channel,
            "thumbnail_url": r.thumbnail_url,
            "duration_seconds": r.duration_seconds,
            "source_url": r.source_url,
            "selected_quality": r.selected_quality,
            "file_size_bytes": r.file_size_bytes,
            "file_size_display": format_file_size(r.file_size_bytes) if r.file_size_bytes else "0 B",
            "file_extension": r.file_extension,
            "status": r.status,
            "progress_percent": r.progress_percent,
            "error_message": r.error_message,
            "created_at": r.created_at,
            "completed_at": r.completed_at
        })
        
    return success_response(history)

@router.delete("/download/{download_id}")
async def delete_download(download_id: int, db: Session = Depends(get_db)):
    record = db.query(YTDownload).filter(YTDownload.id == download_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Download not found")
        
    # Delete file from disk
    if record.file_path and os.path.exists(os.path.dirname(record.file_path)):
        try:
            shutil.rmtree(os.path.dirname(record.file_path))
        except Exception:
            pass
            
    db.delete(record)
    db.commit()
    
    return success_response({"message": "Download record and file deleted"})

@router.delete("/history/clear")
async def clear_history(db: Session = Depends(get_db)):
    records = db.query(YTDownload).all()
    count = len(records)
    
    # Delete files
    output_dir = os.path.join(settings.upload_dir, "yt_downloader")
    if os.path.exists(output_dir):
        for item in os.listdir(output_dir):
            item_path = os.path.join(output_dir, item)
            if os.path.isdir(item_path):
                shutil.rmtree(item_path)
    
    db.query(YTDownload).delete()
    db.commit()
    
    return success_response({"message": "History cleared", "deleted_count": count})
