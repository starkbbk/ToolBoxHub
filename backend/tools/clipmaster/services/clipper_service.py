import subprocess
import os
import logging
from typing import List
from sqlalchemy.orm import Session
from tools.clipmaster.models.clip import Clip
from tools.clipmaster.models.project import Project
from tools.clipmaster.services.youtube_downloader import download_video

logger = logging.getLogger(__name__)

def cut_clip(source_path: str, output_path: str, start_seconds: float, end_seconds: float) -> bool:
    """
    Cuts a segment from the source video using ffmpeg.
    Uses -ss BEFORE -i for fast seeking, and -t for duration.
    """
    duration = end_seconds - start_seconds
    if duration <= 0:
        logger.error(f"Invalid duration for clip: {duration}s")
        return False

    # Command: ffmpeg -y -ss [start] -i [source] -t [duration] -c copy [output]
    # Note: '-c copy' is fast but might have timing issues on some seek points.
    # Re-encoding with libx264 is more reliable for precision.
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_seconds),
        "-i", source_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-strict", "experimental",
        "-preset", "ultrafast",
        output_path
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg error: {e.stderr.decode()}")
        return False

def process_approved_clips(project_id: int, db: Session) -> List[Clip]:
    """
    Processes all currently approved clips for a project that don't have a file_path yet.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        logger.error(f"Project {project_id} not found.")
        return []

    source_path = project.file_path
    
    # If file_path is missing or points to an audio file, and it's YouTube, try to get the video
    if (not source_path or "audio" in source_path) and project.source_type == "youtube":
        logger.info(f"Source video missing for project {project_id}. Attempting to download high-quality source...")
        try:
            # Use current directory or default to settings.upload_dir/clipmaster/project_uuid
            project_dir = os.path.dirname(project.audio_path) if project.audio_path else os.path.dirname(source_path) if source_path else None
            if not project_dir:
                # Fallback to reconstructing path if we somehow have no paths
                from shared.file_utils import generate_uuid
                from config import settings
                # Ideally we'd have the project uuid, but we'll try to use what we have
                pass

            if project_dir:
                dl_info = download_video(project.source_url, project_dir)
                project.file_path = dl_info["video_path"]
                if not project.audio_path:
                    project.audio_path = dl_info["audio_path"]
                db.commit()
                source_path = project.file_path
        except Exception as e:
            logger.error(f"Failed to re-download video source: {str(e)}")
            return []

    if not source_path or not os.path.exists(source_path):
        logger.error(f"Project {project_id} source file not found at {source_path}.")
        return []

    # Ensure uploads directory exists for clips
    clips_dir = os.path.join(os.path.dirname(source_path), "clips")
    os.makedirs(clips_dir, exist_ok=True)

    approved_clips = db.query(Clip).filter(
        Clip.project_id == project_id, 
        Clip.is_approved == True,
        Clip.file_path == None
    ).all()

    processed = []
    for clip in approved_clips:
        output_filename = f"clip_{clip.id}.mp4"
        output_path = os.path.join(clips_dir, output_filename)
        
        success = cut_clip(
            project.file_path, 
            output_path, 
            clip.start_seconds, 
            clip.end_seconds
        )
        
        if success:
            clip.file_path = output_path
            processed.append(clip)
            logger.info(f"Generated clip {clip.id}: {output_path}")
        
    db.commit()
    return processed
