import yt_dlp
import sys

URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
ydl_opts = {
    'quiet': False,
    'extract_flat': False,
    'skip_download': True,
    'extractor_args': {'youtube': {'player_client': ['web']}}
}

try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(URL, download=False)
        print("SUCCESS! Title:", info.get('title'))
except Exception as e:
    print("FAILED:", e)
