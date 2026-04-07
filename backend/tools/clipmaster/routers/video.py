import os
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import aiofiles

from backend.database import get_db
from backend.shared.response import error_response
from backend.tools.clipmaster.models.project import Project

router = APIRouter()

@router.get("/video/{project_id}")
async def stream_video(project_id: int, request: Request, range: str = Header(None), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if not project.file_path or not os.path.exists(project.file_path):
        raise HTTPException(status_code=404, detail="Video file not found")
        
    file_size = os.path.getsize(project.file_path)
    
    # Simple range handling for video streaming
    if range:
        range_str = range.strip().lower()
        if range_str.startswith('bytes='):
            try:
                parts = range_str[6:].split('-')
                start = int(parts[0])
                end = int(parts[1]) if len(parts) > 1 and parts[1] else file_size - 1
            except ValueError:
                start = 0
                end = file_size - 1
        else:
            start = 0
            end = file_size - 1
    else:
        start = 0
        end = file_size - 1

    chunk_size = 1024 * 1024 * 2  # 2MB chunks
    end = min(end, file_size - 1)
    length = end - start + 1
    
    async def file_iterator():
        async with aiofiles.open(project.file_path, 'rb') as async_file:
            await async_file.seek(start)
            bytes_left = length
            while bytes_left > 0:
                chunk = await async_file.read(min(chunk_size, bytes_left))
                if not chunk:
                    break
                bytes_left -= len(chunk)
                yield chunk
                
    headers = {
        'Content-Range': f'bytes {start}-{end}/{file_size}',
        'Accept-Ranges': 'bytes',
        'Content-Length': str(length),
        'Content-Type': 'video/mp4',
    }
    
    status_code = 206 if range else 200
    
    return StreamingResponse(file_iterator(), status_code=status_code, headers=headers)
