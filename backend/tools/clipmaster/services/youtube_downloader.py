import yt_dlp
import os
import re

class YouTubeDownloaderError(Exception):
    pass

def is_valid_youtube_url(url: str) -> bool:
    pattern = r"^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$"
    return bool(re.match(pattern, url))

def download_video(url: str, output_dir: str, progress_callback=None) -> dict:
    if not is_valid_youtube_url(url):
        raise YouTubeDownloaderError("Invalid YouTube URL")

    def hook(d):
        if d['status'] == 'downloading' and progress_callback:
            percent_str = d.get('_percent_str', '0%').strip()
            # Remove ANSI, remove %
            clean_percent = re.sub(r'\x1b\[[0-9;]*m', '', percent_str).replace('%', '')
            try:
                pct = float(clean_percent)
                print(f"DEBUG: Downloading video: {pct}%")
                progress_callback(pct)
            except ValueError:
                pass

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(output_dir, 'audio.%(ext)s'),
        'max_filesize': 26214400,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '5',
        }],
        'progress_hooks': [hook] if progress_callback else [],
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Fetch-Mode': 'navigate',
        },
        'referer': 'https://www.youtube.com/',
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'web'],
                'skip': ['webpage', 'hls', 'dash']
            }
        }
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info_dict)
            return {
                "file_path": filename,
                "title": info_dict.get('title', 'Unknown Title'),
                "duration": info_dict.get('duration', 0),
                "thumbnail_url": info_dict.get('thumbnail', '')
            }
    except Exception as e:
        raise YouTubeDownloaderError(str(e))
