import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import engine, Base
from shared.response import success_response

# Import tools routers
from tools.clipmaster.routers import router as clipmaster_router
from tools.clipmaster.services.progress_manager import progress_manager
from tools.pdf_converter.routers import router as pdf_converter_router
from tools.image_compressor.routers.placeholder import router as image_compressor_router
from tools.audio_transcriber.routers import router as audio_transcriber_router
from tools.text_summarizer.routers import router as text_summarizer_router
from tools.text_remover.routers import router as text_remover_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    # Ensure all upload directories exist
    os.makedirs(os.path.join(settings.upload_dir, "clipmaster"), exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "pdf_converter"), exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "image_compressor"), exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "text_remover"), exist_ok=True)
    yield
    # Shutdown

app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)

# CORS configuration
origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files for Production
from fastapi.staticfiles import StaticFiles

# Ensure upload directories exist
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# API Routes
app.include_router(clipmaster_router, prefix="/api/clipmaster")
app.include_router(pdf_converter_router, prefix="/api/pdf-converter")
app.include_router(image_compressor_router, prefix="/api/image-compressor")
app.include_router(audio_transcriber_router, prefix="/api/audio-transcriber")
app.include_router(text_summarizer_router, prefix="/api/text-summarizer")
app.include_router(text_remover_router, prefix="/api/text-remover")

@app.get("/api/health")
def health_check():
    return success_response({
        "status": "ok",
        "version": settings.app_version,
        "tools": [
            {"id": "clipmaster", "status": "active"},
            {"id": "pdf-converter", "status": "active"},
            {"id": "image-compressor", "status": "coming_soon"},
            {"id": "audio-transcriber", "status": "coming_soon"},
            {"id": "text-summarizer", "status": "coming_soon"},
            {"id": "text-remover", "status": "active"}
        ]
    })

@app.get("/api/tools")
def get_tools():
    return success_response([
        {"id": "clipmaster", "name": "ClipMaster", "status": "active"},
        {"id": "pdf-converter", "name": "PDF Converter", "status": "active"},
        {"id": "image-compressor", "name": "Image Compressor", "status": "coming_soon"},
        {"id": "audio-transcriber", "name": "Audio Transcriber", "status": "coming_soon"},
        {"id": "text-summarizer", "name": "Text Summarizer", "status": "coming_soon"},
        {"id": "text-remover", "name": "Text Remover", "status": "active"}
    ])

@app.websocket("/ws/clipmaster/progress/{project_id}")
async def websocket_progress(websocket: WebSocket, project_id: int):
    print(f"DEBUG: WebSocket connection attempt for project {project_id}")
    await progress_manager.connect(project_id, websocket)
    print(f"DEBUG: WebSocket connected for project {project_id}")
    
    # Send current state immediately so frontend isn't stuck waiting for the next update
    from database import SessionLocal
    from tools.clipmaster.models.project import Project
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            await progress_manager.send_update(
                project_id, 
                project.status, 
                0, 
                f"Project {project.status.replace('_', ' ')}..." if project.status != "uploading" else "Ready to process"
            )
    finally:
        db.close()

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        progress_manager.disconnect(project_id, websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
