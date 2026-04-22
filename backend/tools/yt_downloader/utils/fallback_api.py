import httpx
import logging
import asyncio
import re
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class FallbackDownloader:
    """
    V4 Breakthrough: A dedicated AJAX-based downloader for Oceansaver/vd6s infrastructure.
    Very resilient for 1080p/4K content when yt-dlp/Cobalt are throttled.
    """
    
    # Common endpoints for this infrastructure
    ENDPOINTS = [
        "https://v3.v-mate.com/ajax",
        "https://api.oceansaver.net/ajax",
        "https://vd6s.com/ajax"
    ]

    @staticmethod
    async def get_download_url(url: str, quality: str = "1080") -> Optional[str]:
        """Handshake with AJAX providers to get a direct high-res URL."""
        
        # Normalize quality for these APIs
        q_map = {
            "2160": "4k",
            "1440": "2k",
            "1080": "1080",
            "720": "720",
            "480": "480",
            "360": "360"
        }
        target_q = q_map.get(quality, "1080")

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Origin": "https://vd6s.com",
            "Referer": "https://vd6s.com/",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        }

        for base_url in FallbackDownloader.ENDPOINTS:
            try:
                logger.info(f"V4: Attempting AJAX handshake with {base_url}")
                async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                    # Step 1: Initialize download request
                    data = {
                        "url": url,
                        "format": target_q,
                        "lang": "en"
                    }
                    
                    response = await client.post(base_url, data=data, headers=headers)
                    if response.status_code != 200:
                        continue
                        
                    res_json = response.json()
                    
                    # Some use a polling ID, some return URL immediately
                    if res_json.get("success"):
                        # Handling "success" result which typically has an ID for polling
                        # or a direct 'url'
                        if res_json.get("url"):
                            logger.info(f"V4: Direct High-Res URL found via {base_url}")
                            return res_json.get("url")
                            
                        # If it needs polling (not implemented here for simplicity, 
                        # but often vd6s returns direct or handles it)
                        if res_json.get("id"):
                            # Polling logic could go here if needed
                            pass
                            
            except Exception as e:
                logger.debug(f"Fallback API {base_url} failed: {e}")
                continue
                
        return None

async def get_high_res_url(video_url: str, quality: str = "1080") -> Optional[str]:
    """Top-level entry point for V4 Fallback API."""
    return await FallbackDownloader.get_download_url(video_url, quality)
