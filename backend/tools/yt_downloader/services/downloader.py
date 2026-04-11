import yt_dlp
import os
import uuid
import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.download import YTDownload
from .progress_manager import progress_manager
from ..utils.format_helpers import sanitize_filename
from ..utils.cobalt import get_cobalt_download_url, download_from_url

logger = logging.getLogger(__name__)

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

        is_audio = quality_label == "audio"

        async def _download_with_ytdl():
            # Build format string
            if not is_audio:
                format_str = f"{format_id}+bestaudio[ext=m4a]/best" if "+" not in format_id else format_id
            else:
                format_str = format_id

            def progress_hook(d):
                if d['status'] == 'downloading':
                    progress = d.get('_percent_str', '0%').replace('%', '').strip()
                    try: pct = float(progress)
                    except ValueError: pct = 0
                    
                    speed = d.get('_speed_str', 'N/A')
                    eta = d.get('_eta_str', 'N/A')
                    
                    download_record.progress_percent = int(pct)
                    db.commit()
                    
                    asyncio.run_coroutine_threadsafe(
                        progress_manager.send_update(download_id, "downloading", pct, f"Downloading...", speed, eta),
                        asyncio.get_event_loop()
                    )

            ydl_opts = {
                'format': format_str,
                'outtmpl': os.path.join(final_dir, '%(title).100s.%(ext)s'),
                'merge_output_format': 'mp4' if not is_audio else None,
                'progress_hooks': [progress_hook],
                'noplaylist': True,
                'quiet': True,
                'no_warnings': True,
                'nocheckcertificate': True,
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'extractor_args': {
                    'youtube': {
                        'player_client': ['android_vr', 'ios', 'web'],
                        'player_skip': ['js', 'configs'],
                    }
                },
            }

            if is_audio:
                ydl_opts['postprocessors'] = [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }]

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

        try:
            # Primary attempt with yt-dlp
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: asyncio.run(_download_with_ytdl()))
        except Exception as e:
            error_str = str(e).lower()
            if "sign in" in error_str or "bot" in error_str or "403" in error_str:
                logger.warning("YouTube blocked yt-dlp. Switching to Cobalt Fallback...")
                await progress_manager.send_update(download_id, "downloading", 10, "Bypassing YouTube blocks...")
                
                # Cobalt Quality mapping: 360, 480, 720, 1080, 1440, 2160, max
                cobalt_quality = quality_label.replace("p", "") if not is_audio else "720"
                direct_url = await get_cobalt_download_url(url, cobalt_quality, is_audio)
                
                if not direct_url:
                    raise Exception("All bypass methods failed. YouTube is blocking this server.")
                
                filename = f"video_{uuid.uuid4().hex[:8]}.{'mp3' if is_audio else 'mp4'}"
                final_path = os.path.join(final_dir, filename)
                
                await progress_manager.send_update(download_id, "downloading", 30, "Downloading from bypass engine...")
                await download_from_url(direct_url, final_path)
            else:
                raise e

        # Find final file
        final_file = None
        for f in os.listdir(final_dir):
            if not f.endswith('.part') and not f.endswith('.ytdl'):
                final_file = os.path.join(final_dir, f)
                break
        
        if not final_file:
            raise Exception("Output file not found after download.")

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
        logger.error(f"Download Error: {error_msg}")
        download_record.status = "failed"
        download_record.error_message = error_msg
        db.commit()
        await progress_manager.send_update(download_id, "failed", 0, f"Error: {error_msg}")
