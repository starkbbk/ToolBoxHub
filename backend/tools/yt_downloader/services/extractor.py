import yt_dlp
from typing import Dict, Any, List
from ..utils.format_helpers import format_file_size, parse_youtube_url, format_duration, resolution_sort_key

def extract_video_info(url: str) -> Dict[str, Any]:
    try:
        # Validate URL and get video ID
        video_id = parse_youtube_url(url)
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'skip_download': True,
            'nocheckcertificate': True,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'ios'],
                    'player_skip': ['js', 'configs'],
                }
            },
        }
        
        # Try multiple clients to unlock high-quality streams and bypass blocks
        clients_to_try = [['android_vr', 'ios'], ['android', 'web'], ['tv', 'mweb']]
        info = None
        last_error = None
        
        for client_list in clients_to_try:
            try:
                ydl_opts['extractor_args']['youtube']['player_client'] = client_list
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    temp_info = ydl.extract_info(url, download=False)
                    all_formats = temp_info.get('formats', [])
                    # Check if we got high quality (>= 720p)
                    has_high_res = any(f.get('height', 0) >= 720 for f in all_formats)
                    
                    if has_high_res or not info:
                        info = temp_info
                    
                    if has_high_res:
                        break # Found high quality, move on
            except Exception as e:
                last_error = str(e)
                continue
                
        if not info:
            raise Exception(last_error or "Could not extract video info. YouTube is currently blocking anonymous server requests.")
            
        # Basic metadata
        video_info = {
            "video_id": video_id,
            "title": info.get('title', 'Unknown Title'),
            "channel": info.get('uploader', 'Unknown Channel'),
            "thumbnail_url": info.get('thumbnail', ''),
            "duration_seconds": float(info.get('duration', 0)),
            "duration_formatted": format_duration(info.get('duration', 0)),
            "view_count": info.get('view_count', 0),
            "upload_date": info.get('upload_date', 'Unknown'),
            "description": info.get('description', '')[:200] + "..." if info.get('description') else ""
        }
        
        # Formats extraction logic
        formats_list = []
        seen_keys = set()
        all_formats = info.get('formats', [])
        
        def get_label(h):
            if not h: return None
            if h >= 2160: return "2160p"
            if h >= 1440: return "1440p"
            if h >= 1080: return "1080p"
            if h >= 720: return "720p"
            if h >= 480: return "480p"
            if h >= 360: return "360p"
            return None

        for f in all_formats:
            h = f.get('height')
            label = get_label(h)
            if not label: continue
            
            ext = f.get('ext', 'mp4')
            key = f"{label}_{ext}"
            vcodec = f.get('vcodec', 'none')
            acodec = f.get('acodec', 'none')
            
            if key not in seen_keys:
                formats_list.append({
                    "format_id": f.get('format_id'),
                    "quality_label": label,
                    "extension": ext,
                    "fps": f.get('fps'),
                    "file_size_bytes": f.get('filesize') or f.get('filesize_approx'),
                    "file_size_display": format_file_size(f.get('filesize') or f.get('filesize_approx')),
                    "video_codec": vcodec,
                    "audio_codec": acodec,
                    "has_video": vcodec != 'none',
                    "has_audio": acodec != 'none',
                    "needs_merge": acodec == 'none'
                })
                seen_keys.add(key)
            else:
                # Merge audio if this is a better format
                idx = next((i for i, item in enumerate(formats_list) if f"{item['quality_label']}_{item['extension']}" == key), None)
                if idx is not None and formats_list[idx]["audio_codec"] == 'none' and acodec != 'none':
                    formats_list[idx].update({
                        "format_id": f.get('format_id'),
                        "audio_codec": acodec,
                        "has_audio": True,
                        "needs_merge": False
                    })

        # Add best audio format
        audio_formats = [f for f in all_formats if f.get('vcodec') == 'none' and f.get('acodec') != 'none']
        if audio_formats:
            best_audio = max(audio_formats, key=lambda x: x.get('abr', 0))
            formats_list.append({
                "format_id": best_audio.get('format_id'),
                "quality_label": "audio",
                "extension": "m4a",
                "fps": None,
                "file_size_bytes": best_audio.get('filesize') or best_audio.get('filesize_approx'),
                "file_size_display": format_file_size(best_audio.get('filesize') or best_audio.get('filesize_approx')),
                "video_codec": "none",
                "audio_codec": best_audio.get('acodec'),
                "has_video": False,
                "has_audio": True,
                "needs_merge": False
            })

        formats_list.sort(key=lambda x: resolution_sort_key(x["quality_label"]))
        return {"video_info": video_info, "formats": formats_list}
    except Exception as e:
        raise Exception(f"Failed to extract video info: {str(e)}")
