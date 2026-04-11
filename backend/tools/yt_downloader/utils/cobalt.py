import httpx
import os
import uuid
import logging
import asyncio
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# List of public Cobalt instances for high availability
COBALT_INSTANCES = [
    "https://api.cobalt.tools/api/json",
    "https://cobalt.hypt.me/api/json",
    "https://api.v0.pw/api/json",
    "https://api.cobalt.cloud/api/json"
]

async def get_cobalt_download_url(url: str, quality: str = "1080", is_audio: bool = False) -> Optional[str]:
    """
    Get a direct download URL from Cobalt API with multi-instance fallback.
    quality: '360', '480', '720', '1080', '1440', '2160', 'max'
    """
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Referer": "https://cobalt.tools/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    payload = {
        "url": url,
        "videoQuality": quality if not is_audio else "720",
        "isAudioOnly": is_audio,
        "downloadMode": "audio" if is_audio else "video",
        "youtubeVideoCodec": "vp9" if quality in ["1440", "2160", "max"] else "h264"
    }
    
    for instance_url in COBALT_INSTANCES:
        try:
            logger.info(f"Trying Cobalt instance: {instance_url}")
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(instance_url, json=payload, headers=headers)
                
                if response.status_code != 200:
                    logger.warning(f"Instance {instance_url} returned status {response.status_code}")
                    continue
                    
                data = response.json()
                
                if data.get("status") == "error":
                    logger.warning(f"Instance {instance_url} returned error: {data.get('text')}")
                    continue
                    
                download_url = data.get("url")
                if download_url:
                    logger.info(f"Successfully obtained download URL from {instance_url}")
                    return download_url
                    
        except Exception as e:
            logger.error(f"Failed to call Cobalt instance {instance_url}: {str(e)}")
            continue
            
    return None

async def download_from_url(url: str, output_path: str):
    """Utility to download a file from a direct URL"""
    async with httpx.AsyncClient(timeout=600.0, follow_redirects=True) as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            with open(output_path, "wb") as f:
                async for chunk in response.aiter_bytes():
                    f.write(chunk)
