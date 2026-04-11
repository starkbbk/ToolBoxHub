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
                    'player_client': ['android', 'ios', 'web', 'mweb'],
                    'player_skip': ['js', 'configs'],
                }
            },
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
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
            
            # Formats
            formats_list = []
            seen_heights = set()
            
            # Sort formats to process higher quality first
            all_formats = info.get('formats', [])
            
            # We want to pick the best format for each resolution
            # Standard labels: 2160p, 1440p, 1080p, 720p, 480p, 360p
            
            # Map height to label
            def get_quality_label(height):
                if not height: return None
                if height >= 2160: return "2160p"
                if height >= 1440: return "1440p"
                if height >= 1080: return "1080p"
                if height >= 720: return "720p"
                if height >= 480: return "480p"
                if height >= 360: return "360p"
                return None

            # Process video formats
            for f in all_formats:
                height = f.get('height')
                label = get_quality_label(height)
                
                if not label: continue
                
                # Check for video only vs video+audio
                vcodec = f.get('vcodec', 'none')
                acodec = f.get('acodec', 'none')
                
                # If we haven't seen this resolution or this format is better (has audio)
                if label not in seen_heights:
                    formats_list.append({
                        "format_id": f.get('format_id'),
                        "quality_label": label,
                        "extension": f.get('ext', 'mp4'),
                        "fps": f.get('fps'),
                        "file_size_bytes": f.get('filesize') or f.get('filesize_approx'),
                        "file_size_display": format_file_size(f.get('filesize') or f.get('filesize_approx')),
                        "video_codec": vcodec,
                        "audio_codec": acodec,
                        "has_video": vcodec != 'none',
                        "has_audio": acodec != 'none',
                        "needs_merge": acodec == 'none'
                    })
                    seen_heights.add(label)
                else:
                    # Update if we find a combined format (though YT often separates them for high res)
                    existingIdx = next((i for i, item in enumerate(formats_list) if item["quality_label"] == label), None)
                    if existingIdx is not None and formats_list[existingIdx]["audio_codec"] == 'none' and acodec != 'none':
                        formats_list[existingIdx] = {
                            "format_id": f.get('format_id'),
                            "quality_label": label,
                            "extension": f.get('ext', 'mp4'),
                            "fps": f.get('fps'),
                            "file_size_bytes": f.get('filesize') or f.get('filesize_approx'),
                            "file_size_display": format_file_size(f.get('filesize') or f.get('filesize_approx')),
                            "video_codec": vcodec,
                            "audio_codec": acodec,
                            "has_video": vcodec != 'none',
                            "has_audio": acodec != 'none',
                            "needs_merge": acodec == 'none'
                        }

            # Add one best audio-only format
            audio_formats = [f for f in all_formats if f.get('vcodec') == 'none' and f.get('acodec') != 'none']
            if audio_formats:
                best_audio = max(audio_formats, key=lambda x: x.get('abr', 0))
                formats_list.append({
                    "format_id": best_audio.get('format_id'),
                    "quality_label": "audio",
                    "extension": "m4a", # Standard audio ext for YT
                    "fps": None,
                    "file_size_bytes": best_audio.get('filesize') or best_audio.get('filesize_approx'),
                    "file_size_display": format_file_size(best_audio.get('filesize') or best_audio.get('filesize_approx')),
                    "video_codec": "none",
                    "audio_codec": best_audio.get('acodec'),
                    "has_video": False,
                    "has_audio": True,
                    "needs_merge": False
                })

            # Sort formats by resolution label
            formats_list.sort(key=lambda x: resolution_sort_key(x["quality_label"]))
            
            return {
                "video_info": video_info,
                "formats": formats_list
            }
            
    except Exception as e:
        raise Exception(f"Failed to extract video info: {str(e)}")
