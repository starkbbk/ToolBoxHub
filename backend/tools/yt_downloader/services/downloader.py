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

        is_fallback = format_id.startswith("fallback_")
        is_audio = quality_label == "audio"

        if is_fallback:
            # GHOST DOWNLOAD: Bypass YouTube entirely and use Cobalt
            logger.info(f"Triggering Ghost Download for {quality_label}")
            await progress_manager.send_update(download_id, "downloading", 10, "Bypassing YouTube bot detection...")
            
            # Extract clean quality number from label (e.g., '1080p' -> '1080')
            cobalt_quality = quality_label.replace("p", "")
            if is_audio: cobalt_quality = "720"
            
            direct_url = await get_cobalt_download_url(url, cobalt_quality, is_audio)
            
            if not direct_url:
                raise Exception("The bypass engine is temporarily busy. Please try again in 1 minute.")
                
            extension = "mp3" if is_audio else "mp4"
            filename = f"video_{uuid.uuid4().hex[:8]}.{extension}"
            final_path = os.path.join(final_dir, filename)
            
            await progress_manager.send_update(download_id, "downloading", 30, f"Downloading {quality_label} via bypass engine...")
            await download_from_url(direct_url, final_path)
            
            final_file = final_path
            
        else:
            # NORMAL DOWNLOAD: Try yt-dlp with fallback
            async def _download_with_ytdl():
                format_str = f"{format_id}+bestaudio[ext=m4a]/best" if "+" not in format_id and not is_audio else format_id

                def progress_hook(d):
                    if d['status'] == 'downloading':
                        progress = d.get('_percent_str', '0%').replace('%', '').strip()
                        try: pct = float(progress)
                        except: pct = 0
                        asyncio.run_coroutine_threadsafe(
                            progress_manager.send_update(download_id, "downloading", pct, "Downloading...", d.get('_speed_str', 'N/A'), d.get('_eta_str', 'N/A')),
                            asyncio.get_event_loop()
                        )

                ydl_opts = {
                    'format': format_str,
                    'outtmpl': os.path.join(final_dir, '%(title).100s.%(ext)s'),
                    'merge_output_format': 'mp4' if not is_audio else None,
                    'progress_hooks': [progress_hook],
                    'quiet': True,
                    'no_warnings': True,
                    'nocheckcertificate': True,
                    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'extractor_args': {'youtube': {'player_client': ['android_vr', 'ios']}},
                }
                
                if is_audio:
                    ydl_opts['postprocessors'] = [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3', 'preferredquality': '192'}]

                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])

            try:
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(None, lambda: asyncio.run(_download_with_ytdl()))
                
                # Find the file
                final_file = None
                for f in os.listdir(final_dir):
                    if not f.endswith('.part') and not f.endswith('.ytdl'):
                        final_file = os.path.join(final_dir, f)
                        break
            except Exception as e:
                # If normal fails, try Cobalt as LAST resort even for non-fallback IDs
                logger.warning(f"Normal download failed, trying Cobalt fallback: {str(e)}")
                await progress_manager.send_update(download_id, "downloading", 20, "Primary method blocked. Switching to bypass engine...")
                
                cobalt_quality = "1080" # Default for auto-fallback
                if "1440" in quality_label: cobalt_quality = "1440"
                if "2160" in quality_label: cobalt_quality = "2160"
                if "720" in quality_label: cobalt_quality = "720"
                if "480" in quality_label: cobalt_quality = "480"
                if "360" in quality_label: cobalt_quality = "360"
                
                direct_url = await get_cobalt_download_url(url, cobalt_quality, is_audio)
                if not direct_url: raise e
                
                filename = f"video_{uuid.uuid4().hex[:8]}.{'mp3' if is_audio else 'mp4'}"
                final_path = os.path.join(final_dir, filename)
                await download_from_url(direct_url, final_path)
                final_file = final_path

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
