import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import engine, Base
from backend.shared.response import success_response

# Import tools routers
from backend.tools.clipmaster.routers import router as clipmaster_router
from backend.tools.clipmaster.services.progress_manager import progress_manager
from backend.tools.pdf_converter.routers.placeholder import router as pdf_converter_router
from backend.tools.image_compressor.routers.placeholder import router as image_compressor_router
from backend.tools.audio_transcriber.routers.placeholder import router as audio_transcriber_router
from backend.tools.text_summarizer.routers.placeholder import router as text_summarizer_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    # Ensure all upload directories exist
    os.makedirs(os.path.join(settings.upload_dir, "clipmaster"), exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "pdf_converter"), exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "image_compressor"), exist_ok=True)
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

# API Routes
app.include_router(clipmaster_router, prefix="/api/clipmaster")
app.include_router(pdf_converter_router, prefix="/api/pdf-converter")
app.include_router(image_compressor_router, prefix="/api/image-compressor")
app.include_router(audio_transcriber_router, prefix="/api/audio-transcriber")
app.include_router(text_summarizer_router, prefix="/api/text-summarizer")

@app.get("/api/health")
def health_check():
    return success_response({
        "status": "ok",
        "version": settings.app_version,
        "tools": [
            {"id": "clipmaster", "status": "active"},
            {"id": "pdf-converter", "status": "coming_soon"},
            {"id": "image-compressor", "status": "coming_soon"},
            {"id": "audio-transcriber", "status": "coming_soon"},
            {"id": "text-summarizer", "status": "coming_soon"}
        ]
    })

@app.get("/api/tools")
def get_tools():
    return success_response([
        {"id": "clipmaster", "name": "ClipMaster", "status": "active"},
        {"id": "pdf-converter", "name": "PDF Converter", "status": "coming_soon"},
        {"id": "image-compressor", "name": "Image Compressor", "status": "coming_soon"},
        {"id": "audio-transcriber", "name": "Audio Transcriber", "status": "coming_soon"},
        {"id": "text-summarizer", "name": "Text Summarizer", "status": "coming_soon"}
    ])

@app.websocket("/ws/clipmaster/progress/{project_id}")
async def websocket_progress(websocket: WebSocket, project_id: int):
    await progress_manager.connect(project_id, websocket)
    try:
        while True:
            # Maintain connection until client disconnects or pipeline finishes
            # Pings can be added if needed, right now we just wait for events
            await websocket.receive_text()
    except WebSocketDisconnect:
        progress_manager.disconnect(project_id, websocket)
