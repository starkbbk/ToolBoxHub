import os
import json
import asyncio
import httpx
import logging
from typing import Dict, Any, List
from ..utils.format_helpers import format_file_size, parse_youtube_url, format_duration, resolution_sort_key

logger = logging.getLogger(__name__)

# Path to the standalone yt-dlp binary (v2026.03.17)
YTDLP_BIN = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'yt-dlp_bin')
YTDLP_BIN = os.path.abspath(YTDLP_BIN)

async def get_metadata_via_oembed(url: str) -> Dict[str, Any]:
    """Fallback to get basic metadata via YouTube OEmbed API when yt-dlp is blocked."""
    try:
        oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(oembed_url)
            if response.status_code == 200:
                data = response.json()
                return {
                    "title": data.get("title", "YouTube Video"),
                    "channel": data.get("author_name", "Unknown Channel"),
                    "thumbnail_url": data.get("thumbnail_url", ""),
                    "duration_seconds": 0,
                    "duration_formatted": "00:00",
                    "view_count": 0,
                    "upload_date": "Unknown",
                    "description": "Information retrieved via backup engine."
                }
    except Exception as e:
        logger.error(f"OEmbed fallback failed: {str(e)}")
    return None

def get_synthetic_formats() -> List[Dict[str, Any]]:
    """Return a list of standard quality options when extraction fails."""
    qualities = [
        {"id": "fallback_2160p", "label": "2160p (4K)", "ext": "mp4"},
        {"id": "fallback_1440p", "label": "1440p (2K)", "ext": "mp4"},
        {"id": "fallback_1080p", "label": "1080p (HD)", "ext": "mp4"},
        {"id": "fallback_720p", "label": "720p (HD)", "ext": "mp4"},
        {"id": "fallback_480p", "label": "480p", "ext": "mp4"},
        {"id": "fallback_360p", "label": "360p", "ext": "mp4"},
        {"id": "fallback_audio", "label": "Audio Only", "ext": "mp3"},
    ]
    
    formats = []
    for q in qualities:
        is_audio = q["id"] == "fallback_audio"
        formats.append({
            "format_id": q["id"],
            "quality_label": q["id"].replace("fallback_", ""),
            "extension": q["ext"],
            "fps": 30 if not is_audio else None,
            "file_size_bytes": 0,
            "file_size_display": "Estimated",
            "video_codec": "h264" if not is_audio else "none",
            "audio_codec": "aac" if not is_audio else "mp3",
            "has_video": not is_audio,
            "has_audio": True,
            "needs_merge": False,
            "is_available": True
        })
    return formats

async def run_ytdlp_json(url: str) -> Dict[str, Any]:
    """Run the yt-dlp binary to get JSON info for a URL."""
    try:
        cmd = [
            YTDLP_BIN, 
            '-j', 
            '--no-warnings', 
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            '--impersonate', 'chrome',
            '--extractor-args', 'youtube:player_client=ios,web',
            '--js-runtimes', 'node:/usr/local/bin/node',
            url
        ]
        
        # Ensure /usr/local/bin is in PATH for JS runtime detection
        env = os.environ.copy()
        env["PATH"] = f"/usr/local/bin:/opt/homebrew/bin:{env.get('PATH', '')}"
        env["YT_DLP_JS_RUNTIME"] = "node"
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)
        if stdout:
            return json.loads(stdout.decode('utf-8', errors='ignore'))
    except asyncio.TimeoutError:
        logger.warning("yt-dlp binary timed out")
    except Exception as e:
        logger.warning(f"yt-dlp binary failed: {e}")
    return None

async def extract_video_info(url: str) -> Dict[str, Any]:
    video_id = parse_youtube_url(url)
    info = None

    # Try the standalone binary first
    info = await run_ytdlp_json(url)

    if info:
        video_info = {
            "video_id": video_id,
            "title": info.get('title', 'Unknown Title'),
            "channel": info.get('uploader', 'Unknown Channel'),
            "thumbnail_url": info.get('thumbnail', ''),
            "duration_seconds": float(info.get('duration', 0)),
            "duration_formatted": format_duration(info.get('duration', 0)),
            "view_count": info.get('view_count', 0),
            "upload_date": info.get('upload_date', 'Unknown'),
            "description": (info.get('description', '')[:200] + "...") if info.get('description') else ""
        }

        all_formats = info.get('formats', [])
        formats_list = []
        seen_keys = set()

        def get_label(h):
            if not h: return None
            if h >= 2160: return "2160p"
            if h >= 1440: return "1440p"
            if h >= 1080: return "1080p"
            if h >= 720: return "720p"
            if h >= 480: return "480p"
            if h >= 360: return "360p"
            return None

        has_high_res = any((f.get('height') or 0) >= 720 for f in all_formats)

        if not has_high_res:
            formats_list = get_synthetic_formats()
        else:
            for f in all_formats:
                height = f.get('height')
                label = get_label(height)
                if not label: continue
                
                # We no longer restrict by extension here, we want the best video
                key = label 
                if key not in seen_keys:
                    formats_list.append({
                        "format_id": f.get('format_id'),
                        "quality_label": label,
                        "extension": "mp4", # We display as mp4 because we'll merge to mp4
                        "fps": f.get('fps'),
                        "file_size_bytes": f.get('filesize') or f.get('filesize_approx') or 0,
                        "file_size_display": format_file_size(f.get('filesize') or f.get('filesize_approx')),
                        "video_codec": f.get('vcodec', 'none'),
                        "audio_codec": f.get('acodec', 'none'),
                        "has_video": f.get('vcodec') != 'none',
                        "has_audio": f.get('acodec') != 'none',
                        "needs_merge": f.get('acodec') == 'none',
                        "is_available": True
                    })
                    seen_keys.add(key)

            audio_formats = [f for f in all_formats if f.get('vcodec') == 'none' and f.get('acodec') != 'none']
            if audio_formats:
                best_audio = max(audio_formats, key=lambda x: x.get('abr') or 0)
                formats_list.append({
                    "format_id": best_audio.get('format_id'),
                    "quality_label": "audio",
                    "extension": "mp3",
                    "file_size_bytes": best_audio.get('filesize') or best_audio.get('filesize_approx') or 0,
                    "file_size_display": format_file_size(best_audio.get('filesize') or best_audio.get('filesize_approx')),
                    "has_video": False,
                    "has_audio": True,
                    "needs_merge": False,
                    "is_available": True
                })

    else:
        # GHOST EXTRACTION: Total Blocked Fallback
        meta = await get_metadata_via_oembed(url)
        if not meta:
            raise Exception("Could not extract video info. Please try again.")

        video_info = {**meta, "video_id": video_id}
        formats_list = get_synthetic_formats()

    formats_list.sort(key=lambda x: resolution_sort_key(x["quality_label"]))
    return {"video_info": video_info, "formats": formats_list}
