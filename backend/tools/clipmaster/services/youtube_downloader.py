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

    common_opts = {
        'outtmpl': os.path.join(output_dir, 'video_source.%(ext)s'),
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/',
        },
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'ios', 'web'],
                'skip': ['hls', 'dash']
            }
        }
    }

    # Optimized for Cloud: Prioritize audio extraction for super-fast transcription
    ydl_opts_efficient = {
        **common_opts,
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'progress_hooks': [hook] if progress_callback else [],
    }

    try:
        print("DEBUG: Downloading audio-only for cloud transcription...")
        with yt_dlp.YoutubeDL(ydl_opts_efficient) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            audio_file = os.path.join(output_dir, 'audio_source.mp3')
            
            # Post-processor sometimes names it differently
            if not os.path.exists(audio_file):
                for f in os.listdir(output_dir):
                    if f.endswith('.mp3'):
                        audio_file = os.path.join(output_dir, f)
                        break

            # Metadata only, video path is None for now to save bandwidth
            return {
                "video_path": None, 
                "audio_path": audio_file,
                "title": info_dict.get('title', 'Unknown Title'),
                "duration": info_dict.get('duration', 0),
                "thumbnail_url": info_dict.get('thumbnail', '')
            }
    except Exception as e:
        print(f"ERROR: Downloader failed: {str(e)}")
        raise YouTubeDownloaderError(str(e))
