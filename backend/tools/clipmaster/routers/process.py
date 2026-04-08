from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import asyncio
import os

from database import get_db, SessionLocal
from shared.response import success_response, error_response
from config import settings

from tools.clipmaster.models.project import Project
from tools.clipmaster.models.clip import Clip
from tools.clipmaster.models.transcript import Transcript
from tools.clipmaster.models.rubric import Rubric

from tools.clipmaster.services.transcriber import transcribe
from tools.clipmaster.services.ai_analyzer import analyze_transcript
from tools.clipmaster.services.progress_manager import progress_manager

router = APIRouter()

class ProcessRequest(BaseModel):
    rubric_id: Optional[int] = None

async def run_pipeline(project_id: int, rubric_id: Optional[int] = None):
    print(f"DEBUG: [PROJECT {project_id}] Starting run_pipeline")
    # Retrieve project using a new session for background task
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            print(f"DEBUG: [PROJECT {project_id}] Project not found in database")
            return

        # Skip audio extraction as it's now handled by the downloader/source
        audio_path = project.file_path
        
        if not project.duration_seconds:
            # We can still try to get duration if needed, but for simplicity skip for now or use a lightweight tool
            pass

        # 2. TRANSCRIPTION
        project.status = "transcribing"
        db.commit()
        await progress_manager.send_update(project_id, "transcribing", 0, "Starting cloud transcription...")

        main_loop = asyncio.get_event_loop()
        def trans_progress(pct: float):
            try:
                asyncio.run_coroutine_threadsafe(
                    progress_manager.send_update(project_id, "transcribing", pct, f"Transcribing ({int(pct)}%)"),
                    main_loop
                )
            except Exception as e:
                print(f"WS Transcribe Error: {e}")

        try:
            # transcribe is now async
            trans_result = await transcribe(audio_path, None, trans_progress)
            
            transcript_entry = Transcript(
                project_id=project.id,
                full_text=trans_result["full_text"],
                segments=trans_result["segments"],
                language=trans_result["language"],
                word_count=trans_result["word_count"]
            )
            db.add(transcript_entry)
            db.commit()
        except Exception as e:
            print(f"ERROR: [PROJECT {project_id}] Transcription Failed: {str(e)}")
            project.status = "failed"
            project.error_message = str(e)
            db.commit()
            await progress_manager.send_update(project_id, "failed", 0, f"Transcription failed: {str(e)}")
            return

        # 3. AI ANALYSIS
        project.status = "analyzing"
        db.commit()
        await progress_manager.send_update(project_id, "analyzing", 0, "Starting AI analysis...")
        
        rubric_rules = None
        if rubric_id:
            rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
            if rubric and rubric.rules:
                rubric_rules = rubric.rules

        async def ai_progress(pct: float):
            await progress_manager.send_update(project_id, "analyzing", pct, f"AI analyzing ({int(pct)}%)")

        try:
            analysis_result = await analyze_transcript(trans_result["full_text"], rubric_rules, ai_progress)
            
            # Clear previous clips if re-analyzing
            db.query(Clip).filter(Clip.project_id == project.id).delete()
            
            for c_data in analysis_result["clips"]:
                db.add(Clip(
                    project_id=project.id,
                    start_time=c_data.get("start_time"),
                    end_time=c_data.get("end_time"),
                    start_seconds=0.0, # Will be calculated via util when inserted, skipping for brevity or calculating real quick
                    end_seconds=0.0,
                    title=c_data.get("title", ""),
                    category=c_data.get("category", ""),
                    confidence=int(c_data.get("confidence", 0)),
                    reason=c_data.get("reason", "")
                ))
            
            project.status = "completed"
            db.commit()
            await progress_manager.send_update(project_id, "completed", 100, f"Done! Found {len(analysis_result['clips'])} clips.")
            
        except Exception as e:
            project.status = "failed"
            project.error_message = str(e)
            db.commit()
            await progress_manager.send_update(project_id, "failed", 0, "AI Analysis failed")
            return

    finally:
        db.close()


@router.post("/process/{project_id}")
async def start_processing(project_id: int, background_tasks: BackgroundTasks, data: ProcessRequest = ProcessRequest(), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return error_response("Project not found")

    background_tasks.add_task(run_pipeline, project_id, data.rubric_id)
    return success_response(None, "Processing started")

@router.get("/project/{project_id}/status")
async def get_status(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return error_response("Project not found")
        
    return success_response({
        "status": project.status,
        "message": project.error_message if project.status == "failed" else ""
    })
