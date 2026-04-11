import httpx
import os
import uuid
import logging
import asyncio
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# Expanded list of public Cobalt instances for maximum reliability
COBALT_INSTANCES = [
    "https://api.cobalt.tools/api/json",
    "https://cobalt.hypt.me/api/json",
    "https://api.cobalt.cloud/api/json",
    "https://cobalt.fly.dev/api/json",
    "https://cobalt.miz.moe/api/json",
    "https://api.v0.pw/api/json",
    "https://cobalt.asahi.moe/api/json",
    "https://api.fxtwitter.com/api/json", # Sometimes has a cobalt worker
    "https://cobalt.sh/api/json"
]

async def get_cobalt_download_url(url: str, quality: str = "1080", is_audio: bool = False) -> Optional[str]:
    """
    Get a direct download URL from Cobalt API with multi-instance fallback.
    quality: '360', '480', '720', '1080', '1440', '2160', 'max'
    """
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Origin": "https://cobalt.tools",
        "Referer": "https://cobalt.tools/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }
    
    payload = {
        "url": url,
        "videoQuality": quality if not is_audio else "720",
        "isAudioOnly": is_audio,
        "downloadMode": "audio" if is_audio else "video",
        "youtubeVideoCodec": "vp9" if quality in ["1440", "2160", "max"] else "h264",
        "youtubeVideoAudioOnly": is_audio
    }
    
    # Randomly shuffle or just try in order? Order is fine if we start with reliable ones.
    for instance_url in COBALT_INSTANCES:
        try:
            logger.info(f"Connecting to Bypass Engine: {instance_url}")
            async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
                response = await client.post(instance_url, json=payload, headers=headers)
                
                if response.status_code == 429:
                    logger.warning(f"Engine {instance_url} is rate-limited (429).")
                    continue
                    
                if response.status_code != 200:
                    logger.warning(f"Engine {instance_url} failed with status {response.status_code}")
                    continue
                    
                data = response.json()
                
                # Cobalt can return 'stream', 'redirect', 'pickle'
                status = data.get("status")
                
                if status == "error":
                    error_text = data.get("text", "Unknown error")
                    logger.warning(f"Engine {instance_url} returned error: {error_text}")
                    # If the error is specifically about the video being unavailable, we can stop
                    if "unavailable" in error_text.lower() or "private" in error_text.lower():
                        return None
                    continue
                    
                download_url = data.get("url")
                if download_url:
                    logger.info(f"Bypass successful via {instance_url}")
                    return download_url
                    
        except Exception as e:
            logger.error(f"Engine connection failed ({instance_url}): {str(e)}")
            continue
            
    return None

async def download_from_url(url: str, output_path: str):
    """Utility to download a file from a direct URL with retries"""
    retry_count = 0
    max_retries = 3
    
    while retry_count < max_retries:
        try:
            async with httpx.AsyncClient(timeout=300.0, follow_redirects=True) as client:
                async with client.stream("GET", url) as response:
                    response.raise_for_status()
                    total_size = int(response.headers.get("Content-Length", 0))
                    downloaded = 0
                    
                    with open(output_path, "wb") as f:
                        async for chunk in response.aiter_bytes():
                            f.write(chunk)
                            downloaded += len(chunk)
                    return True
        except Exception as e:
            retry_count += 1
            logger.warning(f"Download attempt {retry_count} failed: {str(e)}")
            if retry_count >= max_retries:
                raise e
            await asyncio.sleep(2)
    return False
