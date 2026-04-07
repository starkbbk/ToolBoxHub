from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.tools.pdf_converter.models.pdf_job import PDFJob
from backend.tools.pdf_converter.schemas.pdf_job import PDFJobResponse

router = APIRouter()

@router.get("/status/{job_id}", response_model=PDFJobResponse)
async def get_job_status(job_id: int, db: Session = Depends(get_db)):
    job = db.query(PDFJob).filter(PDFJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/history", response_model=list[PDFJobResponse])
async def get_jobs_history(db: Session = Depends(get_db)):
    return db.query(PDFJob).order_by(PDFJob.created_at.desc()).limit(20).all()
