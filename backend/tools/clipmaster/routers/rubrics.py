from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from shared.response import success_response, error_response
from tools.clipmaster.models.rubric import Rubric
from tools.clipmaster.schemas.rubric import RubricCreate, RubricUpdate, RubricResponse

router = APIRouter()

@router.get("/rubrics")
def get_rubrics(db: Session = Depends(get_db)):
    rubrics = db.query(Rubric).all()
    data = [RubricResponse.model_validate(r).model_dump() for r in rubrics]
    return success_response(data)

@router.post("/rubric")
def create_rubric(rubric_data: RubricCreate, db: Session = Depends(get_db)):
    new_rubric = Rubric(
        name=rubric_data.name,
        description=rubric_data.description,
        rules=rubric_data.rules,
        is_default=rubric_data.is_default
    )
    db.add(new_rubric)
    db.commit()
    db.refresh(new_rubric)
    return success_response(RubricResponse.model_validate(new_rubric).model_dump())

@router.get("/rubric/{rubric_id}")
def get_rubric(rubric_id: int, db: Session = Depends(get_db)):
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    if not rubric:
        return error_response("Rubric not found")
    return success_response(RubricResponse.model_validate(rubric).model_dump())

@router.put("/rubric/{rubric_id}")
def update_rubric(rubric_id: int, rubric_data: RubricUpdate, db: Session = Depends(get_db)):
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    if not rubric:
        return error_response("Rubric not found")
        
    update_dict = rubric_data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(rubric, k, v)
        
    db.commit()
    db.refresh(rubric)
    return success_response(RubricResponse.model_validate(rubric).model_dump())

@router.delete("/rubric/{rubric_id}")
def delete_rubric(rubric_id: int, db: Session = Depends(get_db)):
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    if not rubric:
        return error_response("Rubric not found")
        
    db.delete(rubric)
    db.commit()
    return success_response(None, "Rubric deleted")
