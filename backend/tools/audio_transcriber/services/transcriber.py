import httpx
from typing import Dict, Any, List
from config import settings

class TranscriberError(Exception):
    pass

async def transcribe_audio(file_content: bytes, filename: str) -> Dict[str, Any]:
    """
    Transcribes audio using Groq's Whisper API.
    """
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
    }
    
    # Groq expects a multipart form with 'file' and 'model'
    files = {
        "file": (filename, file_content),
    }
    data = {
        "model": "whisper-large-v3",
        "response_format": "verbose_json",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.groq_base_url}/audio/transcriptions",
                headers=headers,
                files=files,
                data=data,
                timeout=120.0
            )
            response.raise_for_status()
            result = response.json()
            
            # Extract basic info
            return {
                "text": result.get("text", ""),
                "language": result.get("language", "en"),
                "duration": result.get("duration", 0),
                "segments": [
                    {
                        "start": s.get("start"),
                        "end": s.get("end"),
                        "text": s.get("text")
                    } for s in result.get("segments", [])
                ]
            }
    except Exception as e:
        print(f"Transcription failed: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
             print(f"Error details: {e.response.text}")
        raise TranscriberError(f"Audio transcription failed: {str(e)}")
