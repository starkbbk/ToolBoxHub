import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks
from typing import List, Optional
import json

from config import settings
from shared.response import success_response, error_response
from .services import InpainterService, OCRService

router = APIRouter()
inpainter = InpainterService()
ocr = OCRService()

@router.post("/detect")
async def detect_text_regions(
    image: UploadFile = File(...),
):
    """
    Detect text regions in an image/frame using EasyOCR.
    Returns bounding boxes for each detected text area.
    """
    try:
        image_bytes = await image.read()
        regions = ocr.detect_text(image_bytes)
        return success_response({"regions": regions, "count": len(regions)})
    except Exception as e:
        return error_response(str(e))


@router.post("/image")
async def remove_text_image(
    image: UploadFile = File(...),
    regions: str = Form(...), # JSON string of regions: [{"x": 10, "y": 20, "w": 30, "h": 40}, ...]
    radius: int = Form(10)
):
    """
    Remove text from an image by providing the region coordinates.
    The backend generates a dilated mask for seamless inpainting.
    """
    try:
        # Save uploads
        job_id = str(uuid.uuid4())
        upload_dir = os.path.join(settings.upload_dir, "text_remover", job_id)
        os.makedirs(upload_dir, exist_ok=True)
        
        image_path = os.path.join(upload_dir, "original.png")
        output_path = os.path.join(upload_dir, "cleaned.png")
        
        with open(image_path, "wb") as f:
            f.write(await image.read())
            
        mask_regions = json.loads(regions)
            
        # Process using the improved region-based inpainter
        inpainter.inpaint_image(image_path, mask_regions, output_path, radius)
        
        return success_response({
            "job_id": job_id,
            "output_path": f"/api/text-remover/download/{job_id}/cleaned.png"
        })
    except Exception as e:
        return error_response(str(e))

@router.post("/video")
async def remove_text_video(
    video: UploadFile = File(...),
    regions: str = Form(...), # JSON string of regions
    background_tasks: BackgroundTasks = None
):
    """
    Remove text from a video. 
    This is long-running, so we'll ideally use a background task and polling/WS.
    """
    try:
        job_id = str(uuid.uuid4())
        upload_dir = os.path.join(settings.upload_dir, "text_remover", job_id)
        os.makedirs(upload_dir, exist_ok=True)
        
        video_path = os.path.join(upload_dir, "original.mp4")
        output_path = os.path.join(upload_dir, "cleaned.mp4")
        
        with open(video_path, "wb") as f:
            f.write(await video.read())
            
        mask_regions = json.loads(regions)
        
        # For this prototype, we'll run it synchronously but ideally it's background
        # in_painter.inpaint_video(video_path, mask_regions, output_path)
        
        # Temporary: Running synchronously for immediate feedback in simple tasks
        # If it takes > 30s, the request might timeout.
        inpainter.inpaint_video(video_path, mask_regions, output_path)
        
        return success_response({
            "job_id": job_id,
            "output_path": f"/api/text-remover/download/{job_id}/cleaned.mp4"
        })
    except Exception as e:
        return error_response(str(e))

from fastapi.responses import FileResponse
@router.get("/download/{job_id}/{filename}")
async def download_file(job_id: str, filename: str):
    file_path = os.path.join(settings.upload_dir, "text_remover", job_id, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return error_response("File not found", status_code=404)
