import subprocess
import os
import re
from typing import Callable, Optional

class VideoProcessingError(Exception):
    pass

def get_video_duration(video_path: str) -> float:
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries",
             "format=duration", "-of",
             "default=noprint_wrappers=1:nokey=1", video_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        return float(result.stdout.strip())
    except Exception:
        return 0.0

def extract_audio(video_path: str, output_dir: str, progress_callback: Optional[Callable[[float], None]] = None) -> str:
    if not os.path.exists(video_path):
        raise VideoProcessingError(f"Video file not found: {video_path}")
        
    output_path = os.path.join(output_dir, "audio.wav")
    total_duration = get_video_duration(video_path)
    
    command = [
        "ffmpeg", "-i", video_path, "-vn", "-acodec", "pcm_s16le",
        "-ar", "16000", "-ac", "1", "-y", output_path
    ]
    
    # Run FFmpeg and capture progress
    process = subprocess.Popen(command, stderr=subprocess.PIPE, text=True, universal_newlines=True)
    
    time_pattern = re.compile(r"time=(\d+):(\d+):(\d+\.\d+)")
    
    for line in process.stderr:
        if progress_callback and total_duration > 0:
            match = time_pattern.search(line)
            if match:
                hours, minutes, seconds = map(float, match.groups())
                current_time = hours * 3600 + minutes * 60 + seconds
                percent = min(100.0, (current_time / total_duration) * 100)
                progress_callback(percent)
                
    process.wait()
    
    if process.returncode != 0:
        raise VideoProcessingError("FFmpeg process failed")
        
    return output_path
