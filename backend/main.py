import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import psutil
import logging

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
    # Atomic DB Init - only if no other worker has done it
    try:
        if not os.path.exists('db_init.lock'):
            with open('db_init.lock', 'w') as f:
                f.write('locked')
            Base.metadata.create_all(bind=engine)
            logging.info("DATABASE INITIALIZED")
    except Exception as e:
        logging.warning(f"DB INIT SKIPPED: {e}")
    
    os.makedirs(os.path.join(settings.upload_dir, "clipmaster"), exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "pdf_converter"), exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "image_compressor"), exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "text_remover"), exist_ok=True)
    
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / 1024 / 1024
    logging.info(f"API STARTUP MEMORY: {mem:.2f} MB")
    yield

app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)

@app.get("/")
async def root():
    return {"status": "alive", "service": "ToolboxHub Backend", "msg": "API is online."}

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(clipmaster_router, prefix="/api/clipmaster")
app.include_router(pdf_converter_router, prefix="/api/pdf-converter")
app.include_router(image_compressor_router, prefix="/api/image-compressor")
app.include_router(audio_transcriber_router, prefix="/api/audio-transcriber")
app.include_router(text_summarizer_router, prefix="/api/text-summarizer")
app.include_router(text_remover_router, prefix="/api/text-remover")

@app.get("/api/health")
def health_check():
    process = psutil.Process(os.getpid())
    mem_mb = process.memory_info().rss / 1024 / 1024
    return success_response({"status": "ok", "memory_usage_mb": round(mem_mb, 2)})

@app.get("/api/tools")
def get_tools():
    return success_response([{"id": "clipmaster", "status": "active"}, {"id": "text-remover", "status": "active"}])

@app.websocket("/ws/clipmaster/progress/{project_id}")
async def websocket_progress(websocket: WebSocket, project_id: int):
    await progress_manager.connect(project_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        progress_manager.disconnect(project_id, websocket)
