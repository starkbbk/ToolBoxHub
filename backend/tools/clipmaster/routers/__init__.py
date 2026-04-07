from fastapi import APIRouter

from .upload import router as upload_router
from .process import router as process_router
from .clips import router as clips_router
from .export import router as export_router
from .rubrics import router as rubrics_router
from .projects import router as projects_router
from .video import router as video_router

router = APIRouter()

router.include_router(upload_router, tags=["Upload"])
router.include_router(projects_router, tags=["Projects"])
router.include_router(process_router, tags=["Process"])
router.include_router(clips_router, tags=["Clips"])
router.include_router(export_router, tags=["Export"])
router.include_router(rubrics_router, tags=["Rubrics"])
router.include_router(video_router, tags=["Video"])
