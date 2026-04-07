import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.tools.pdf_converter.models.pdf_job import PDFJob
from backend.tools.pdf_converter.services.pdf_manipulator import PDFManipulator
from backend.shared.response import APIResponse
from typing import List

router = APIRouter()

async def run_merge_pipeline(job_id: int, pdf_paths: List[str], db: Session):
    job = db.query(PDFJob).filter(PDFJob.id == job_id).first()
    if not job: return
    
    try:
        job.status = "processing"
        job.job_type = "merge"
        db.commit()
        
        job_dir = os.path.dirname(job.original_file_path) if job.original_file_path else os.path.join("uploads", "pdf_converter", "merged")
        os.makedirs(job_dir, exist_ok=True)
        
        output_path = os.path.join(job_dir, "merged.pdf")
        PDFManipulator.merge_pdfs(pdf_paths, output_path)
        
        job.output_path = output_path
        job.status = "completed"
        db.commit()
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        db.commit()

@router.post("/merge")
async def merge_pdfs(
    background_tasks: BackgroundTasks, 
    pdf_ids: List[int] = Body(...), 
    db: Session = Depends(get_db)
):
    # Find all source jobs
    source_jobs = db.query(PDFJob).filter(PDFJob.id.in_(pdf_ids)).all()
    if not source_jobs:
        raise HTTPException(status_code=404, detail="No source PDFs found")
    
    paths = [j.original_file_path for j in source_jobs if j.original_file_path]
    
    # Create a new job for the merge result
    new_job = PDFJob(title="Merged Document", status="uploaded", job_type="merge")
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    background_tasks.add_task(run_merge_pipeline, new_job.id, paths, db)
    return APIResponse.success(data={"job_id": new_job.id}, message="Merge started")

@router.post("/{job_id}/split")
async def split_pdf(
    job_id: int, 
    background_tasks: BackgroundTasks, 
    ranges: List[List[int]] = Body(...), # e.g. [[0, 2], [3, 5]]
    db: Session = Depends(get_db)
):
    job = db.query(PDFJob).filter(PDFJob.id == job_id).first()
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    
    # Logic for splitting can be added here as a background task
    # For now, we update the job status
    return APIResponse.success(message="Split functionality coming soon in detail")
