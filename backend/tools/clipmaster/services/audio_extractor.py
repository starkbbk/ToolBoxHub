import subprocess
import os
import logging

logger = logging.getLogger(__name__)

def extract_compressed_audio(input_path: str, output_path: str, bitrate: str = "48k") -> bool:
    """
    Extracts audio from a video/audio file and compresses it to a low-bitrate MP3 
    to ensure it fits within transcription API limits (e.g. 25MB).
    
    48k bitrate mono provides ~33MB per hour, which is usually safe for most 45-60min videos.
    """
    try:
        # Check if ffmpeg is available
        # Using specific path if known, otherwise trust it's in PATH
        ffmpeg_cmd = "ffmpeg"
        
        # Command: ffmpeg -y -i input -vn -ar 16000 -ac 1 -ab [bitrate] -f mp3 output
        cmd = [
            ffmpeg_cmd, "-y",
            "-i", input_path,
            "-vn",              # Disable video
            "-ar", "16000",     # 16kHz is ideal for Whisper
            "-ac", "1",         # Mono
            "-ab", bitrate,     # Bitrate
            "-f", "mp3",
            output_path
        ]
        
        logger.info(f"Extracting compressed audio: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg error: {result.stderr}")
            return False
            
        return True
    except Exception as e:
        logger.error(f"Failed to extract compressed audio: {str(e)}")
        return False

def get_file_size_mb(path: str) -> float:
    try:
        if os.path.exists(path):
            return os.path.getsize(path) / (1024 * 1024)
        return 0.0
    except:
        return 0.0
