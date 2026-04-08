import math
import httpx
import os
from typing import Callable, Optional
from config import settings
from tools.clipmaster.utils.time_formatter import seconds_to_timestamp
from pydub import AudioSegment

async def _send_to_groq(client, file_path, start_offset=0.0):
    with open(file_path, "rb") as audio_file:
        response = await client.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            files={"file": (os.path.basename(file_path), audio_file, "audio/mpeg")},
            data={
                "model": "whisper-large-v3",
                "response_format": "verbose_json",
                "timestamp_granularities[]": "segment"
            }
        )
        response.raise_for_status()
        res = response.json()
        
        for seg in res.get("segments", []):
            seg["start"] += start_offset
            seg["end"] += start_offset
            
        return res

async def transcribe(audio_path: str, language: Optional[str] = None, progress_callback: Optional[Callable[[float], None]] = None) -> dict:
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is not set.")

    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    MAX_SIZE_MB = 25
    
    segments_list = []
    full_text_parts = []
    word_count = 0
    total_duration = 0.0
    lang = "en"
    
    if progress_callback:
        progress_callback(5.0)

    async with httpx.AsyncClient(timeout=600) as client:
        if file_size_mb <= MAX_SIZE_MB:
            try:
                res = await _send_to_groq(client, audio_path)
                total_duration = res.get("duration", 0)
                lang = res.get("language", "en")
                for seg in res.get("segments", []):
                    segments_list.append(seg)
            except Exception as e:
                print(f"ERROR: Groq Transcription failed: {str(e)}")
                raise e
            if progress_callback: progress_callback(90.0)
        else:
            print(f"DEBUG: File size {file_size_mb:.2f}MB > 25MB. Chunking with pydub...")
            audio = AudioSegment.from_file(audio_path)
            total_duration = len(audio) / 1000.0
            
            CHUNK_LENGTH_MS = 15 * 60 * 1000 
            chunks = [audio[i:i + CHUNK_LENGTH_MS] for i in range(0, len(audio), CHUNK_LENGTH_MS)]
            
            for i, chunk in enumerate(chunks):
                chunk_path = f"{audio_path}_chunk{i}.mp3"
                chunk.export(chunk_path, format="mp3", bitrate="64k") 
                
                offset_sec = (i * CHUNK_LENGTH_MS) / 1000.0
                try:
                    res = await _send_to_groq(client, chunk_path, offset_sec)
                    for seg in res.get("segments", []):
                        segments_list.append(seg)
                    if i == 0: lang = res.get("language", "en")
                except Exception as e:
                    print(f"ERROR: Groq Transcription chunk {i} failed: {str(e)}")
                    raise e
                finally:
                    if os.path.exists(chunk_path):
                        os.remove(chunk_path)
                        
                if progress_callback:
                    pct = 5.0 + 85.0 * ((i + 1) / len(chunks))
                    progress_callback(pct)

    for seg in segments_list:
        start_str = seconds_to_timestamp(seg["start"])
        end_str = seconds_to_timestamp(seg["end"])
        text = seg["text"].strip()
        
        full_text_parts.append(f"[{start_str} - {end_str}] {text}")
        seg["start_str"] = start_str
        seg["end_str"] = end_str
        word_count += len(text.split())

    if progress_callback:
        progress_callback(100.0)

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
