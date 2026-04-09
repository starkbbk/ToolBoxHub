import yt_dlp
import os
import re

class YouTubeDownloaderError(Exception):
    pass

def is_valid_youtube_url(url: str) -> bool:
    pattern = r"^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$"
    return bool(re.match(pattern, url))

import httpx
import uuid

def download_via_cobalt(url: str, output_dir: str) -> dict:
    """Fallback downloader using Cobalt API to bypass bot detection"""
    print(f"DEBUG: Triggering Cobalt Fallback for URL: {url}")
    try:
        api_url = "https://api.cobalt.tools/api/json"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "ToolboxHub/1.0"
        }
        payload = {
            "url": url,
            "videoQuality": "720",
            "audioFormat": "mp3",
            "downloadMode": "audio", # For ClipMaster transcription
            "isAudioOnly": True
        }
        
        with httpx.Client(timeout=60.0) as client:
            response = client.post(api_url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "error":
                raise YouTubeDownloaderError(f"Cobalt Error: {data.get('text')}")
                
            stream_url = data.get("url")
            if not stream_url:
                raise YouTubeDownloaderError("No stream URL in Cobalt response")
                
            # Download the file from the stream URL
            audio_file = os.path.join(output_dir, f'audio_fallback_{uuid.uuid4().hex[:8]}.mp3')
            with client.stream("GET", stream_url) as r:
                r.raise_for_status()
                with open(audio_file, "wb") as f:
                    for chunk in r.iter_bytes():
                        f.write(chunk)
            
            return {
                "video_path": None,
                "audio_path": audio_file,
                "title": "YouTube Video (Cobalt Fallback)",
                "duration": 0,
                "thumbnail_url": ""
            }
    except Exception as e:
        print(f"ERROR: Cobalt Fallback failed: {str(e)}")
        raise YouTubeDownloaderError(f"All download methods failed. YouTube is very aggressive right now: {str(e)}")

def download_video(url: str, output_dir: str, progress_callback=None) -> dict:
    if not is_valid_youtube_url(url):
        raise YouTubeDownloaderError("Invalid YouTube URL")

    # Define protocols to rotate through
    clients = [
        ['android_vr', 'ios'],
        ['tv', 'web']
    ]

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
            err_msg = str(e).lower()
            print(f"DEBUG: Client signature {client_list} failed: {err_msg}")
            
            # Check if this is a boat-block error
            if "sign in to confirm" in err_msg or "bot" in err_msg or "403" in err_msg:
                print("DEBUG: YouTube Bot Detection detected. Switching to Fallback...")
                return download_via_cobalt(url, output_dir)
            
            continue

    # Final attempt with Cobalt if everything else is blocked
    return download_via_cobalt(url, output_dir)
