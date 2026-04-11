import httpx
import os
import uuid
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

COBALT_API_URL = "https://api.cobalt.tools/api/json"

async def get_cobalt_download_url(url: str, quality: str = "1080", is_audio: bool = False) -> Optional[str]:
    """
    Get a direct download URL from Cobalt API.
    quality: '360', '480', '720', '1080', '1440', '2160', 'max'
    """
    try:
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        payload = {
            "url": url,
            "videoQuality": quality if not is_audio else "720",
            "isAudioOnly": is_audio,
            "downloadMode": "audio" if is_audio else "video",
            "youtubeVideoCodec": "vp9" if quality in ["1440", "2160", "max"] else "h264"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(COBALT_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "error":
                logger.error(f"Cobalt Error: {data.get('text')}")
                return None
                
            return data.get("url")
            
    except Exception as e:
        logger.error(f"Cobalt API call failed: {str(e)}")
        return None

async def download_from_url(url: str, output_path: str):
    """Utility to download a file from a direct URL"""
    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            with open(output_path, "wb") as f:
                async for chunk in response.aiter_bytes():
                    f.write(chunk)
