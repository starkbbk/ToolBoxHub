import yt_dlp
import os
import uuid
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.download import YTDownload
from .progress_manager import progress_manager
from ..utils.format_helpers import sanitize_filename

async def download_video(
    db: Session,
    download_id: int,
    url: str,
    format_id: str,
    quality_label: str,
    output_dir: str
):
    # Fetch record from DB
    download_record = db.query(YTDownload).filter(YTDownload.id == download_id).first()
    if not download_record:
        return

    try:
        # Create user-specific directory
        user_uuid = uuid.uuid4().hex[:8]
        final_dir = os.path.join(output_dir, user_uuid)
        os.makedirs(final_dir, exist_ok=True)

        # Build format string
        # If video-only format selected (common for 1080p+), merge with best audio
        if quality_label != "audio":
            if "+" not in format_id: # If not already a combined format string
                # We want the selected format + best audio, and merge them into mp4
                format_str = f"{format_id}+bestaudio[ext=m4a]/best"
            else:
                format_str = format_id
        else:
            format_str = format_id

        def progress_hook(d):
            if d['status'] == 'downloading':
                progress = d.get('_percent_str', '0%').replace('%', '').strip()
                try:
                    pct = float(progress)
                except ValueError:
                    pct = 0
                
                speed = d.get('_speed_str', 'N/A')
                eta = d.get('_eta_str', 'N/A')
                
                # Update DB (non-blocking)
                download_record.progress_percent = int(pct)
                db.commit()
                
                # Send WebSocket update
                asyncio.run_coroutine_threadsafe(
                    progress_manager.send_update(
                        download_id, 
                        "downloading", 
                        pct, 
                        f"Downloading {quality_label} stream...",
                        speed,
                        eta
                    ),
                    asyncio.get_event_loop()
                )
            
            elif d['status'] == 'finished':
                # Update DB
                download_record.progress_percent = 95
                download_record.status = "merging" if quality_label != "audio" else "completed"
                db.commit()
                
                msg = "Merging streams..." if quality_label != "audio" else "Download complete!"
                asyncio.run_coroutine_threadsafe(
                    progress_manager.send_update(download_id, "merging" if quality_label != "audio" else "completed", 95, msg),
                    asyncio.get_event_loop()
                )

        ydl_opts = {
            'format': format_str,
            'outtmpl': os.path.join(final_dir, '%(title).100s.%(ext)s'),
            'merge_output_format': 'mp4' if quality_label != "audio" else None,
            'progress_hooks': [progress_hook],
            'noplaylist': True,
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'ios', 'web', 'mweb'],
                    'player_skip': ['js', 'configs'],
                }
            },
        }

        # If audio only, we want to extract audio
        if quality_label == "audio":
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }]

        # Run in a separate thread to keep FastAPI async
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: _run_ydl(ydl_opts, url))

        # Find the final file
        final_file = None
        for f in os.listdir(final_dir):
            # Pick the most likely file (not part files)
            if not f.endswith('.part') and not f.endswith('.ytdl'):
                final_file = os.path.join(final_dir, f)
                break
        
        if not final_file:
            raise Exception("Output file not found after download")

        # Update DB final state
        download_record.status = "completed"
        download_record.progress_percent = 100
        download_record.file_path = final_file
        download_record.file_size_bytes = os.path.getsize(final_file)
        download_record.file_extension = final_file.split('.')[-1]
        download_record.completed_at = datetime.utcnow()
        db.commit()

        await progress_manager.send_update(download_id, "completed", 100, "Download complete!", file_size=download_record.file_size_bytes)

    except Exception as e:
        error_msg = str(e)
        download_record.status = "failed"
        download_record.error_message = error_msg
        db.commit()
        await progress_manager.send_update(download_id, "failed", 0, f"Error: {error_msg}")

def _run_ydl(opts, url):
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])
