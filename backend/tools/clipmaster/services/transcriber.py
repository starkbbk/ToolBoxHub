import math
from typing import Callable, Optional
from faster_whisper import WhisperModel
from backend.config import settings
from backend.tools.clipmaster.utils.time_formatter import seconds_to_timestamp

# Singleton pattern for the model
model = None

def get_model():
    global model
    if model is None:
        model = WhisperModel(
            settings.whisper_model,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type
        )
    return model

def transcribe(audio_path: str, language: Optional[str] = None, progress_callback: Optional[Callable[[float], None]] = None) -> dict:
    model_instance = get_model()
    
    segments_generator, info = model_instance.transcribe(
        audio_path,
        beam_size=5,
        word_timestamps=True,
        language=language,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500)
    )
    
    full_text_parts = []
    segments_list = []
    word_count = 0
    total_duration = info.duration
    
    last_progress = 0
    
    for segment in segments_generator:
        start_str = seconds_to_timestamp(segment.start)
        end_str = seconds_to_timestamp(segment.end)
        
        full_text_parts.append(f"[{start_str} - {end_str}] {segment.text.strip()}")
        
        segments_list.append({
            "start": start_str,
            "end": end_str,
            "text": segment.text.strip()
        })
        
        word_count += len(segment.text.split())
        
        if progress_callback and total_duration > 0:
            percent = (segment.end / total_duration) * 100
            # call back every ~5%
            if percent - last_progress >= 5 or percent >= 100:
                progress_callback(min(100.0, percent))
                last_progress = percent
                
    if progress_callback and last_progress < 100:
        progress_callback(100.0)

    return {
        "full_text": "\n".join(full_text_parts) + "\n",
        "segments": segments_list,
        "language": info.language,
        "duration": info.duration,
        "word_count": word_count
    }
