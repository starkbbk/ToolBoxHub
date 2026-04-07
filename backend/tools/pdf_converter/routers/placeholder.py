from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
def status():
    return {"status": "coming_soon", "name": "PDF Converter"}
