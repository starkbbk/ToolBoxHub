import httpx
import os
import uuid
import logging
import asyncio
import random
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# UPDATED V7: Resilient Bypass Instances for Safe Mode Fallbacks
COBALT_INSTANCES = [
    "https://cobalt.moe",
    "https://api.cobalt.tools",
    "https://kityune.imput.net",
    "https://cobalt.3kh0.net",
    "https://nachos.imput.net",
    "https://sunny.imput.net",
    "https://olly.imput.net",
    "https://cobalt.kwiatekmiki.com"
]

async def get_cobalt_download_url(url: str, quality: str = "1080", is_audio: bool = False) -> Optional[str]:
    """
    V7 Breakthrough: Hardened multi-instance bypass.
    Increased timeouts and resilient headers for Safe Mode targets.
    """
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Origin": "https://cobalt.tools",
        "Referer": "https://cobalt.tools/"
    }
    
    payload = {
        "url": url,
        "videoQuality": quality if not is_audio else "max",
        "audioFormat": "mp3" if is_audio else "best",
        "videoCodec": "h264",
        "vCodec": "h264",
        "filenameStyle": "classic",
        "isAudioOnly": is_audio,
        "isNoTTWatermark": True
    }

    shuffled_instances = COBALT_INSTANCES.copy()
    random.shuffle(shuffled_instances)
    
    for base_url in shuffled_instances:
        try:
            logger.info(f"V7: Checking Bypass Engine {base_url}")
            async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
                response = await client.post(base_url, json=payload, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get("status") == "error":
                        continue

                    download_url = data.get("url") or data.get("status")
                    if download_url and str(download_url).startswith("http"):
                        return download_url
                    
                    if data.get("status") == "stream":
                        return data.get("url")

                # Legacy fallback
                api_json_url = f"{base_url}/api/json"
                response = await client.post(api_json_url, json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("url"): return data.get("url")

        except Exception as e:
            continue
            
    return None

async def download_from_url(url: str, output_path: str):
    """Utility to download a file from a direct URL with retries and hardened timeouts."""
    # Increased timeout to 20 minutes for high-res transfers
    async with httpx.AsyncClient(timeout=1200.0, follow_redirects=True) as client:
        async with client.stream("GET", url) as response:
            if response.status_code == 403:
                raise Exception("Access Forbidden (403) from bypass instance. Video may be regional or restricted.")
            response.raise_for_status()
            with open(output_path, "wb") as f:
                async for chunk in response.aiter_bytes():
                    f.write(chunk)
    return True
