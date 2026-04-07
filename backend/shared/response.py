from typing import Any, Optional, Dict
from pydantic import BaseModel

class APIResponse(BaseModel):
    success: bool
    message: str = ""
    data: Optional[Any] = None

def success_response(data: Any = None, message: str = "success") -> Dict[str, Any]:
    return {"success": True, "message": message, "data": data}

def error_response(message: str, data: Any = None) -> Dict[str, Any]:
    return {"success": False, "message": message, "data": data}
