from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.shared.response import success_response, error_response
from backend.shared.file_utils import generate_uuid, get_extension
from backend.config import settings
from backend.tools.clipmaster.models.project import Project
from backend.tools.clipmaster.services.youtube_downloader import is_valid_youtube_url, download_video
from pydantic import BaseModel
import os
import aiofiles

router = APIRouter()

ALLOWED_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".webm"}

class ProcessUrlRequest(BaseModel):
    url: str

@router.post("/upload")
async def upload_video(video: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = get_extension(video.filename)
    if ext not in ALLOWED_EXTENSIONS:
        return error_response(f"Invalid file extension. Allowed: {ALLOWED_EXTENSIONS}")

    project_uuid = generate_uuid()
    project_dir = os.path.join(settings.upload_dir, "clipmaster", project_uuid)
    os.makedirs(project_dir, exist_ok=True)
    
    file_path = os.path.join(project_dir, f"original{ext}")

    # stream to avoid loading huge file entirely in memory
    try:
        async with aiofiles.open(file_path, "wb") as f:
            while content := await video.read(1024 * 1024): # 1MB chunks
                await f.write(content)
    except Exception as e:
        return error_response(f"Upload failed: {str(e)}")

    new_project = Project(
        title=video.filename,
        source_type="upload",
        file_path=file_path,
        status="uploaded"
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return success_response({
        "project_id": new_project.id,
        "title": new_project.title,
        "status": new_project.status
    })

@router.post("/process-url")
def process_url(data: ProcessUrlRequest, db: Session = Depends(get_db)):
    url = data.url
    if not is_valid_youtube_url(url):
        return error_response("Invalid YouTube URL")

    project_uuid = generate_uuid()
    project_dir = os.path.join(settings.upload_dir, "clipmaster", project_uuid)
    os.makedirs(project_dir, exist_ok=True)
    
    try:
        # Note: the task says downloading happens synchronously here.
        # Alternatively we could put it in the background processor to not block API.
        # Description says: `process-url` Uses yt-dlp to download video + extract title.
        dl_info = download_video(url, project_dir)
        
        new_project = Project(
            title=dl_info["title"],
            source_type="youtube",
            source_url=url,
            file_path=dl_info["file_path"],
            duration_seconds=dl_info["duration"],
            status="uploaded" # Now ready for processing
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)

        return success_response({
            "project_id": new_project.id,
            "title": new_project.title,
            "status": new_project.status
        })

    except Exception as e:
        return error_response(f"Download failed: {str(e)}")
