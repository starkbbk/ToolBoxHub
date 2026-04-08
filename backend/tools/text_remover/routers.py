import os
import uuid
import json
import logging
from fastapi import APIRouter, UploadFile, File, Form, Response
from typing import List, Optional
from fastapi.responses import FileResponse

from config import settings
from shared.response import success_response, error_response
from .services import InpainterService, log_memory_usage

router = APIRouter()
inpainter = InpainterService()
logger = logging.getLogger(__name__)

@router.post("/image")
async def inpaint_image_endpoint(
    image: UploadFile = File(...),
    regions: str = Form(...), # JSON string of regions: [{"x": 10, "y": 20, "w": 30, "h": 40}, ...]
    radius: int = Form(7)
):
    """
    Surgical inpainting endpoint for images.
    Accepts original image + mask data from frontend Tesseract.js.
    """
    try:
        job_id = str(uuid.uuid4())
        upload_dir = os.path.join(settings.upload_dir, "text_remover", job_id)
        os.makedirs(upload_dir, exist_ok=True)
        
        image_path = os.path.join(upload_dir, "original.png")
        output_path = os.path.join(upload_dir, "cleaned.png")
        
        # Save original
        with open(image_path, "wb") as f:
            f.write(await image.read())
            
        mask_regions = json.loads(regions)
            
        # Perform NS inpainting
        inpainter.inpaint_image(image_path, mask_regions, output_path, radius)
        
        log_memory_usage(f"Inpaint Image Complete - {job_id}")
        
        return success_response({
            "job_id": job_id,
            "output_path": f"/api/text-remover/download/{job_id}/cleaned.png"
        })
    except Exception as e:
        logger.error(f"Inpaint error: {str(e)}")
        return error_response(str(e))

@router.post("/video-frame")
async def inpaint_frame_endpoint(
    frame: UploadFile = File(...),
    regions: str = Form(...), # JSON string of regions
    radius: int = Form(7)
):
    """
    Surgical inpainting endpoint for single frames.
    Used for frame-by-frame processing from frontend.
    """
    try:
        frame_bytes = await frame.read()
        mask_regions = json.loads(regions)
        
        result_bytes = inpainter.inpaint_frame_bytes(frame_bytes, mask_regions, radius)
        
        return Response(content=result_bytes, media_type="image/png")
    except Exception as e:
        logger.error(f"Frame inpaint error: {str(e)}")
        return error_response(str(e))

@router.post("/video")
async def legacy_video_inpaint(
    video: UploadFile = File(...),
    regions: str = Form(...),
):
    """
    Legacy video endpoint - still available for background processing.
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
        inpainter.inpaint_video(video_path, mask_regions, output_path)
        
        return success_response({
            "job_id": job_id,
            "output_path": f"/api/text-remover/download/{job_id}/cleaned.mp4"
        })
    except Exception as e:
        return error_response(str(e))

@router.get("/download/{job_id}/{filename}")
async def download_file(job_id: str, filename: str):
    file_path = os.path.join(settings.upload_dir, "text_remover", job_id, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return error_response("File not found", status_code=404)
