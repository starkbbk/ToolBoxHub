from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import shutil
import os

from backend.database import get_db
from backend.shared.response import success_response, error_response
from backend.tools.clipmaster.models.project import Project
from backend.tools.clipmaster.schemas.project import ProjectResponse, ProjectDetailResponse

router = APIRouter()

@router.get("/projects")
def get_projects(limit: int = 20, offset: int = 0, status: str = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
        
    projects = query.order_by(Project.created_at.desc()).offset(offset).limit(limit).all()
    
    # We could augment with clip_count but basic fields match ProjectResponse
    data = []
    for p in projects:
        p_dict = ProjectResponse.model_validate(p).model_dump()
        p_dict['clip_count'] = len(p.clips) if p.clips else 0
        data.append(p_dict)
        
    return success_response(data)

@router.get("/project/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return error_response("Project not found")
        
    return success_response(ProjectDetailResponse.model_validate(project).model_dump())

@router.delete("/project/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return error_response("Project not found")
        
    if project.file_path:
        # Delete directory of the project
        project_dir = os.path.dirname(project.file_path)
        if os.path.exists(project_dir):
            try:
                shutil.rmtree(project_dir)
            except Exception:
                pass
                
    db.delete(project)
    db.commit()
    
    return success_response(None, "Project deleted")
