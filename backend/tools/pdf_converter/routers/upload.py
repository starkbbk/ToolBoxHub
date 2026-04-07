import os
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.tools.pdf_converter.models.pdf_job import PDFJob
from backend.tools.pdf_converter.schemas.pdf_job import PDFJobResponse
from backend.shared.file_utils import generate_uuid_filename
from backend.config import settings

router = APIRouter()

@router.post("/upload", response_model=PDFJobResponse)
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Create job directory
    import uuid
    job_id_str = str(uuid.uuid4())
    upload_dir = os.path.join(settings.upload_dir, "pdf_converter", job_id_str)
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, "original.pdf")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create Job in DB
    job = PDFJob(
        title=file.filename,
        original_file_path=file_path,
        status="uploaded"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return job
