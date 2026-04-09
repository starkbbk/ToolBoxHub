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

    # Define protocols to rotate through if they get blocked
    # android_vr and tv often work where web/android fail
    clients = [
        ['android_vr', 'ios'], # Mobile/VR Protocols (Very reliable)
        ['tv', 'web'], # TV/Web fallback
        ['android', 'ios', 'web'] # Final generic fallback
    ]

    last_error = "Unknown Error"

    for client_list in clients:
        print(f"DEBUG: Trying download with client signature: {client_list}")
        
        def hook(d):
            if d['status'] == 'downloading' and progress_callback:
                percent_str = d.get('_percent_str', '0%').strip()
                clean_percent = re.sub(r'\x1b\[[0-9;]*m', '', percent_str).replace('%', '')
                try:
                    pct = float(clean_percent)
                    progress_callback(pct)
                except ValueError:
                    pass

        ydl_opts = {
            'outtmpl': os.path.join(output_dir, 'video_source.%(ext)s'),
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'noplaylist': True,
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'extractor_args': {
                'youtube': {
                    'player_client': client_list,
                    'skip': ['hls', 'dash']
                }
            },
            'progress_hooks': [hook] if progress_callback else [],
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(url, download=True)
                audio_file = os.path.join(output_dir, 'audio_source.mp3')
                
                # Check for audio file (handle different extensions)
                if not os.path.exists(audio_file):
                    for f in os.listdir(output_dir):
                        if f.endswith('.mp3'):
                            audio_file = os.path.join(output_dir, f)
                            break
                            
                return {
                    "video_path": None, 
                    "audio_path": audio_file,
                    "title": info_dict.get('title', 'Unknown Title'),
                    "duration": info_dict.get('duration', 0),
                    "thumbnail_url": info_dict.get('thumbnail', '')
                }
        except Exception as e:
            last_error = str(e)
            print(f"DEBUG: Client signature {client_list} failed line: {last_error}")
            continue

    print(f"ERROR: All clients blocked by YouTube: {last_error}")
    raise YouTubeDownloaderError(f"YouTube block detected. Please try another video or contact admin: {last_error}")
