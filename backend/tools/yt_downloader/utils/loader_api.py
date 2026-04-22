import httpx
import asyncio
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class LoaderDownloader:
    """
    V6 Breakthrough: A dedicated engine for the Loader.to / Y3Mate infrastructure.
    Uses a two-step GET/Check process that is highly resilient to YouTube bot detection.
    """
    
    API_URL = "https://loader.to/ajax/download.php"
    PROGRESS_URL = "https://loader.to/ajax/progress.php"

    @staticmethod
    async def get_download_url(url: str, quality: str = "1080") -> Optional[str]:
        """Handshake with Loader system and poll for a direct high-res URL."""
        
        # Loader formats: 360, 480, 720, 1080, 1440, 4k, 8k, mp3, m4a, webm
        q_map = {
            "2160": "4k",
            "1440": "1440",
            "1080": "1080",
            "720": "720",
            "480": "480",
            "360": "360"
        }
        target_q = q_map.get(quality, "1080")

        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                # Step 1: Initialize
                init_params = {
                    "url": url,
                    "format": target_q
                }
                
                logger.info(f"V6 Loader: Handshaking for {quality}p")
                resp = await client.get(LoaderDownloader.API_URL, params=init_params)
                if resp.status_code != 200:
                    return None
                    
                data = resp.json()
                if not data.get("success"):
                    logger.warning(f"Loader init failed: {data.get('text')}")
                    return None
                    
                job_id = data.get("id")
                if not job_id:
                    return None
                
                # Step 2: Poll for progress and the final URL
                logger.info(f"V6 Loader: Success! Polling Job ID {job_id}")
                
                # We'll poll for max 60 seconds
                for i in range(30):
                    await asyncio.sleep(2)
                    prog_resp = await client.get(LoaderDownloader.PROGRESS_URL, params={"id": job_id})
                    if prog_resp.status_code != 200:
                        continue
                        
                    prog_data = prog_resp.json()
                    
                    if prog_data.get("success") == 1:
                        download_url = prog_data.get("download_url")
                        if download_url:
                            logger.info(f"V6 Loader: Direct High-Res URL received!")
                            return download_url
                    
                    if prog_data.get("text") and "error" in str(prog_data.get("text")).lower():
                        logger.warning(f"Loader Polling Error: {prog_data.get('text')}")
                        break
                        
        except Exception as e:
            logger.error(f"V6 Loader Engine Failed: {e}")
            
        return None

async def get_loader_url(video_url: str, quality: str = "1080") -> Optional[str]:
    """Top-level entry point for V6 Loader Engine."""
    return await LoaderDownloader.get_download_url(video_url, quality)
