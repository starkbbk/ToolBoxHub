import re
import math

def format_file_size(bytes_count: int) -> str:
    if bytes_count is None or bytes_count == 0:
        return "Unknown size"
    if bytes_count <= 0:
        return "0 B"
    size_name = ("B", "KB", "MB", "GB", "TB")
    i = int(math.floor(math.log(bytes_count, 1024)))
    p = math.pow(1024, i)
    s = round(bytes_count / p, 2)
    return "%s %s" % (s, size_name[i])

def resolution_sort_key(quality_label: str) -> int:
    mapping = {
        "2160p": 0,
        "1440p": 1,
        "1080p": 2,
        "720p": 3,
        "480p": 4,
        "360p": 5,
        "audio": 6
    }
    return mapping.get(quality_label, 10)

def sanitize_filename(title: str) -> str:
    # Remove characters that are not allowed in filenames
    sanitized = re.sub(r'[\\/*?:"<>|]', "", title)
    # Replace spaces with underscores or keep them? Let's keep them but trim
    sanitized = sanitized.strip()
    # Limit length
    return sanitized[:100]

def parse_youtube_url(url: str) -> str:
    """
    Extracts the video ID from a YouTube URL.
    Supports:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID
    """
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'youtu\.be\/([0-9A-Za-z_-]{11})',
        r'shorts\/([0-9A-Za-z_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
            
    raise ValueError("Invalid YouTube URL")

def format_duration(seconds: float) -> str:
    if not seconds:
        return "00:00"
    seconds = int(seconds)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"
