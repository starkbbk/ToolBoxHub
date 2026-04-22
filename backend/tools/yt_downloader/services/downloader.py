import os
import uuid
import asyncio
import logging
from datetime import datlight etime
from sqlalchemy.orm import Session
from ..models.download import YTDownload
from .progress_manager import progress_manager
from ..utils.format_helpers import sanitize_filename
from ..utils.cobalt import get_cobalt_download_url, download_from_url
from ..utils.fallback_api import get_high_res_url
from ..utils.loader_api import get_loader_url

logger = logging.getLogger(__name__)

# Path to the standalone yt-dlp binary (v2026.03.17)
YTDLP_BIN = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'yt-dlp_bin')
YTDLP_BIN = os.path.abspath(YTDLP_BIN)

# Path to ffmpeg/ffprobe
FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg"
FFPROBE_PATH = "/opt/homebrew/bin/ffprobe"

async def get_video_height(file_path: str) -> int:
    """Helper to check the actual resolution of a downloaded video file via ffprobe."""
    try:
        cmd = [
            FFPROBE_PATH,
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=height',
            '-of', 'csv=s=x:p=0',
            file_path
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        if stdout:
            return int(stdout.decode().strip())
    except Exception as e:
        logger.error(f"V7 Sentinel: Resolution check failed for {file_path}: {e}")
    return 0

async def download_video(
    db: Session,
    download_id: int,
    url: str,
    format_id: str,
    quality_label: str,
    output_dir: str
):
    download_record = db.query(YTDownload).filter(YTDownload.id == download_id).first()
    if not download_record:
        return

    try:
        user_uuid = uuid.uuid4().hex[:8]
        final_dir = os.path.join(output_dir, user_uuid)
        os.makedirs(final_dir, exist_ok=True)

        is_audio = quality_label == "audio"
        requested_height = int(quality_label.replace("p", "")) if "p" in quality_label else 0
        
        # TARGETS FOR V7: 1080p -> 720p -> 360p (Safe Mode)
        targets = [requested_height]
        if requested_height > 720: targets.append(720)
        if not is_audio: targets.append(360) # Ultimate Safe Mode
        
        final_file = None
        current_status_msg = ""

        for current_target in targets:
            if final_file: break
            
            is_safe_mode = current_target == 360 and requested_height > 360
            quality_text = f"{current_target}p"
            
            if is_safe_mode:
                current_status_msg = "Optimizing for best available quality (Safe Mode)..."
                logger.info(f"V7: Entering Safe Mode (360p) for {url}")
            else:
                current_status_msg = f"Attempting {quality_text} extraction..."
                logger.info(f"V7: Attempting download target: {current_target}p")
                
            await progress_manager.send_update(download_id, "downloading", 5, current_status_msg)
            
            # --- ENGINE 1: yt-dlp binary with android client (v7) ---
            try:
                # For 360p Safe Mode, we use a simpler selector that rarely fails
                if is_safe_mode:
                    fmt_str = "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best"
                else:
                    fmt_str = f"bv*[height<={current_target}]+ba/b[height<={current_target}]" if not is_audio else "bestaudio/best"
                
                await _download_with_binary(url, fmt_str, final_dir, download_id, is_audio, current_target)
                
                for f in os.listdir(final_dir):
                    if not f.endswith('.part') and not f.endswith('.ytdl') and not f.endswith('.temp'):
                        test_file = os.path.join(final_dir, f)
                        if not is_audio and not is_safe_mode:
                            actual_h = await get_video_height(test_file)
                            # Only trap if we are in High-Res mode and got low-res
                            if actual_h < (current_target * 0.8):
                                logger.warning(f"V7 Trap: Got {actual_h}p for {current_target}p. Moving to bypass engines.")
                                os.remove(test_file)
                                continue
                        final_file = test_file
                        break
                if final_file: break
            except Exception as e:
                logger.warning(f"Engine 1 failed for {current_target}p: {e}")

            # --- ENGINE 2: Loader.to / Fallback AJAX (v7) ---
            if not final_file and not is_audio:
                try:
                    await progress_manager.send_update(download_id, "downloading", 25, "Standard engine restricted. Switching to Bypass Suite...")
                    direct_url = await get_loader_url(url, str(current_target))
                    if not direct_url: direct_url = await get_high_res_url(url, str(current_target))
                    
                    if direct_url:
                        filename = f"video_{uuid.uuid4().hex[:8]}.mp4"
                        final_path = os.path.join(final_dir, filename)
                        await download_from_url(direct_url, final_path)
                        final_file = final_path
                        break
                except Exception as e:
                    logger.warning(f"Engine 2 failed for {current_target}p: {e}")

            # --- ENGINE 3: Cobalt V10.2 ---
            if not final_file:
                try:
                    await progress_manager.send_update(download_id, "downloading", 45, "Using emergency high-res bypass...")
                    cob_q = str(current_target) if not is_audio else "max"
                    direct_url = await get_cobalt_download_url(url, cob_q, is_audio)
                    if direct_url:
                        filename = f"vid_{uuid.uuid4().hex[:8]}.{'mp3' if is_audio else 'mp4'}"
                        final_path = os.path.join(final_dir, filename)
                        await download_from_url(direct_url, final_path)
                        final_file = final_path
                        break
                except Exception as e:
                    logger.warning(f"Engine 3 failed for {current_target}p: {e}")

        if not final_file:
            raise Exception("YouTube's 2026 security blocks are currently preventing all extraction methods. Even Safe Mode has failed. Please try again later.")

        # FINAL COMPLETE
        msg = "Download Successful!"
        actual_res = await get_video_height(final_file) if not is_audio else 0
        if requested_height > actual_res and actual_res > 0:
            msg = f"Download Successful! (Optimized to {actual_res}p due to YouTube restrictions)"
            
        download_record.status = "completed"
        download_record.progress_percent = 100
        download_record.file_path = final_file
        download_record.file_size_bytes = os.path.getsize(final_file)
        download_record.file_extension = final_file.split('.')[-1]
        download_record.completed_at = datetime.utcnow()
        db.commit()

        await progress_manager.send_update(download_id, "completed", 100, msg)

    except Exception as e:
        error_msg = str(e)
        logger.error(f"V7 Final Failure: {error_msg}")
        download_record.status = "failed"
        download_record.error_message = error_msg
        db.commit()
        await progress_manager.send_update(download_id, "failed", 0, f"Error: {error_msg}")


async def _download_with_binary(url: str, fmt_str: str, out_dir: str, download_id: int, is_audio: bool, target_h: int):
    """Execution helper for yt-dlp binary with v7 hardened settings."""
    out_template = os.path.join(out_dir, '%(title).80s.%(ext)s')

    cmd = [
        YTDLP_BIN,
        '-f', fmt_str,
        '-o', out_template,
        '--ffmpeg-location', FFMPEG_PATH,
        '--merge-output-format', 'mp4' if not is_audio else 'mp3',
        '--newline',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        '--impersonate', 'chrome',
        '--extractor-args', 'youtube:player_client=android,web',
        '--js-runtimes', 'node:/usr/local/bin/node',
        url
    ]

    if is_audio: cmd += ['--extract-audio', '--audio-format', 'mp3', '--audio-quality', '192K']

    env = os.environ.copy()
    env["PATH"] = f"/usr/local/bin:/opt/homebrew/bin:{env.get('PATH', '')}"
    env["YT_DLP_JS_RUNTIME"] = "node"

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=env
    )

    last_pct = 5
    async for line in proc.stdout:
        text = line.decode('utf-8', errors='ignore').strip()
        if not text: continue
        
        if '[download]' in text and '%' in text:
            try:
                parts = text.split()
                for part in parts:
                    if part.endswith('%'):
                        pct = float(part.replace('%', '').strip())
                        if pct > last_pct:
                            last_pct = pct
                            speed, eta = "", ""
                            for i, p in enumerate(parts):
                                if p == "at": speed = parts[i+1] if i+1 < len(parts) else ""
                                if p == "ETA": eta = parts[i+1] if i+1 < len(parts) else ""
                            await progress_manager.send_update(download_id, "downloading", pct, f"Downloading streams ({target_h}p)...", speed, eta)
                        break
            except Exception: pass
        elif 'Merging' in text:
            await progress_manager.send_update(download_id, "downloading", 95, "Merging quality streams...")

    await proc.wait()
    if proc.returncode != 0:
        raise Exception(f"Engine 1 Error (Code {proc.returncode})")
