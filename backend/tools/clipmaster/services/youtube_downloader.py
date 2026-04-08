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

    # Primary attempt: High-quality video + audio
    ydl_opts_video = {
        **common_opts,
        'format': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best',
        'merge_output_format': 'mp4',
        'progress_hooks': [hook] if progress_callback else [],
    }

    # Fallback attempt: Audio only (much harder to block)
    ydl_opts_audio = {
        **common_opts,
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': os.path.join(output_dir, 'audio_source.%(ext)s'),
    }

    try:
        try:
            print("DEBUG: Attempting full video download...")
            with yt_dlp.YoutubeDL(ydl_opts_video) as ydl:
                info_dict = ydl.extract_info(url, download=True)
                video_file = ydl.prepare_filename(info_dict)
                
                # Check for merged file
                if not os.path.exists(video_file):
                    for f in os.listdir(output_dir):
                        if f.startswith('video_source.'):
                            video_file = os.path.join(output_dir, f)
                            break
                
                # Extract audio from the video file
                audio_file = os.path.join(output_dir, "audio_source.mp3")
                os.system(f"ffmpeg -i \"{video_file}\" -vn -acodec libmp3lame -y \"{audio_file}\" > /dev/null 2>&1")
                
                return {
                    "video_path": video_file,
                    "audio_path": audio_file if os.path.exists(audio_file) else video_file,
                    "title": info_dict.get('title', 'Unknown Title'),
                    "duration": info_dict.get('duration', 0),
                    "thumbnail_url": info_dict.get('thumbnail', '')
                }
        except Exception as e:
            if "403" in str(e) or "Forbidden" in str(e):
                print(f"DEBUG: Video block detected (403). Falling back to audio-only download...")
                with yt_dlp.YoutubeDL(ydl_opts_audio) as ydl:
                    info_dict = ydl.extract_info(url, download=True)
                    audio_file = os.path.join(output_dir, "audio_source.mp3")
                    
                    # yt-dlp might have named it something else with post-processing
                    if not os.path.exists(audio_file):
                        for f in os.listdir(output_dir):
                            if f.endswith('.mp3'):
                                audio_file = os.path.join(output_dir, f)
                                break

                    return {
                        "video_path": None, # Signal to UI that we are using audio-only
                        "audio_path": audio_file,
                        "title": info_dict.get('title', 'Unknown Title (Audio Only)'),
                        "duration": info_dict.get('duration', 0),
                        "thumbnail_url": info_dict.get('thumbnail', '')
                    }
            raise e
    except Exception as e:
        raise YouTubeDownloaderError(str(e))
