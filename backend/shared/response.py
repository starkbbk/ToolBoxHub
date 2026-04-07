from typing import Any, Optional, Dict
from pydantic import BaseModel
from fastapi import HTTPException

class APIResponse(BaseModel):
    success: bool
    message: str = ""
    data: Optional[Any] = None

def success_response(data: Any = None, message: str = "success") -> Dict[str, Any]:
    return {"success": True, "message": message, "data": data}

def error_response(message: str, status_code: int = 400) -> Any:
    raise HTTPException(status_code=status_code, detail=message)
