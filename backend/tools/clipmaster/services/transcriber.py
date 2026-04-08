import httpx
import os
from typing import Callable, Optional, Awaitable
from config import settings
from tools.clipmaster.utils.time_formatter import seconds_to_timestamp

async def _send_to_groq(client, file_path, start_offset=0.0):
    with open(file_path, "rb") as audio_file:
        response = await client.post(
            f"{settings.groq_base_url}/audio/transcriptions",
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            files={"file": (os.path.basename(file_path), audio_file)},
            data={
                "model": "whisper-large-v3",
                "response_format": "verbose_json",
                "timestamp_granularities[]": "segment"
            }
        )
        if response.status_code != 200:
            error_data = response.json()
            raise ValueError(f"Groq API Error: {error_data.get('error', {}).get('message', 'Unknown error')}")
            
        res = response.json()
        
        for seg in res.get("segments", []):
            seg["start"] += start_offset
            seg["end"] += start_offset
            
        return res

async def transcribe(audio_path: str, language: Optional[str] = None, progress_callback: Optional[Callable[[float], Awaitable[None]]] = None) -> dict:
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is not set.")

    # Robust path resolution: check if file exists, if not, look for common audio extensions
    if not os.path.exists(audio_path):
        project_dir = os.path.dirname(audio_path)
        if os.path.exists(project_dir):
            files = os.listdir(project_dir)
            # Prioritize files starting with 'audio.'
            audio_files = [f for f in files if f.startswith('audio.')]
            if audio_files:
                audio_path = os.path.join(project_dir, audio_files[0])
                print(f"DEBUG: Found alternative audio path: {audio_path}")
            else:
                raise FileNotFoundError(f"Could not find audio file at {audio_path} or any 'audio.*' fallback.")
        else:
            raise FileNotFoundError(f"Project directory not found: {project_dir}")

    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    MAX_SIZE_MB = 25
    
    if file_size_mb > MAX_SIZE_MB:
        raise ValueError(f"File size ({file_size_mb:.2f}MB) exceeds the 25MB limit for cloud transcription even after compression attempts. Please use a shorter video (e.g. under 45 mins).")

    segments_list = []
    full_text_parts = []
    word_count = 0
    total_duration = 0.0
    lang = "en"
    
    if progress_callback:
        await progress_callback(10.0)

    async with httpx.AsyncClient(timeout=600) as client:
        try:
            res = await _send_to_groq(client, audio_path)
            total_duration = res.get("duration", 0)
            lang = res.get("language", "en")
            for seg in res.get("segments", []):
                segments_list.append(seg)
        except Exception as e:
            print(f"ERROR: Groq Transcription failed: {str(e)}")
            raise e
        
        if progress_callback: await progress_callback(90.0)

    for seg in segments_list:
        start_str = seconds_to_timestamp(seg["start"])
        end_str = seconds_to_timestamp(seg["end"])
        text = seg["text"].strip()
        
        full_text_parts.append(f"[{start_str} - {end_str}] {text}")
        seg["start_str"] = start_str
        seg["end_str"] = end_str
        word_count += len(text.split())

    if progress_callback:
        await progress_callback(100.0)

    formatted_segments_list = []
    for seg in segments_list:
        formatted_segments_list.append({
            "start": seg["start_str"],
            "end": seg["end_str"],
            "text": seg["text"].strip()
        })

    return {
        "full_text": "\n".join(full_text_parts) + "\n",
        "segments": formatted_segments_list,
        "language": lang,
        "duration": total_duration,
        "word_count": word_count
    }
