import os
import zipfile
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from tools.pdf_converter.models.pdf_job import PDFJob
from tools.pdf_converter.services.pdf_service import PDFService
from shared.response import APIResponse

router = APIRouter()

async def run_to_images_pipeline(job_id: int, db: Session):
    job = db.query(PDFJob).filter(PDFJob.id == job_id).first()
    if not job: return

    try:
        job.status = "processing"
        job.job_type = "to-images"
        db.commit()

        job_dir = os.path.dirname(job.original_file_path)
        output_dir = os.path.join(job_dir, "images")
        
        # Get info
        info = PDFService.get_info(job.original_file_path)
        job.page_count = info["page_count"]
        
        # Convert
        image_paths = PDFService.convert_to_images(job.original_file_path, output_dir)
        
        # Create ZIP
        zip_path = os.path.join(job_dir, "pages.zip")
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for img in image_paths:
                zipf.write(img, os.path.basename(img))
        
        job.output_path = zip_path
        job.status = "completed"
        db.commit()
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        db.commit()

async def run_to_text_pipeline(job_id: int, db: Session):
    job = db.query(PDFJob).filter(PDFJob.id == job_id).first()
    if not job: return

    try:
        job.status = "processing"
        job.job_type = "to-text"
        db.commit()

        text = PDFService.extract_text(job.original_file_path)
        
        job_dir = os.path.dirname(job.original_file_path)
        output_txt = os.path.join(job_dir, "extracted.txt")
        with open(output_txt, "w") as f:
            f.write(text)
            
        job.output_path = output_txt
        job.status = "completed"
        db.commit()
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        db.commit()

@router.post("/{job_id}/to-images")
async def pdf_to_images(job_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    job = db.query(PDFJob).filter(PDFJob.id == job_id).first()
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    
    background_tasks.add_task(run_to_images_pipeline, job_id, db)
    return APIResponse.success(message="Image conversion started")

@router.post("/{job_id}/to-text")
async def pdf_to_text(job_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    job = db.query(PDFJob).filter(PDFJob.id == job_id).first()
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    
    background_tasks.add_task(run_to_text_pipeline, job_id, db)
    return APIResponse.success(message="Text extraction started")
