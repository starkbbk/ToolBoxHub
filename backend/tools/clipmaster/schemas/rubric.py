from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class RubricBase(BaseModel):
    name: str
    description: Optional[str] = None
    rules: List[str]

class RubricCreate(RubricBase):
    is_default: bool = False

class RubricUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[List[str]] = None
    is_default: Optional[bool] = None

class RubricResponse(RubricBase):
    id: int
    is_default: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
