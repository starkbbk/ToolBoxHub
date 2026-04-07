from fastapi import APIRouter
from .upload import router as upload_router
from .convert import router as convert_router
from .manipulate import router as manipulate_router
from .info import router as info_router

router = APIRouter()

router.include_router(upload_router, tags=["Upload"])
router.include_router(convert_router, prefix="/convert", tags=["Conversion"])
router.include_router(manipulate_router, prefix="/manipulate", tags=["Manipulation"])
router.include_router(info_router, tags=["Status"])
