import csv
import json
import os
import tempfile
from typing import List
from backend.tools.clipmaster.models.clip import Clip
from backend.tools.clipmaster.utils.time_formatter import seconds_to_timestamp

def export_csv(clips: List[Clip]) -> str:
    fd, path = tempfile.mkstemp(suffix=".csv")
    with os.fdopen(fd, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["#", "Start Time", "End Time", "Duration (s)", "Title", "Category", "Confidence", "Reason", "Approved", "Notes"])
        for idx, clip in enumerate(clips, 1):
            writer.writerow([
                idx,
                clip.start_time,
                clip.end_time,
                clip.end_seconds - clip.start_seconds if clip.end_seconds and clip.start_seconds else 0,
                clip.title,
                clip.category,
                clip.confidence,
                clip.reason,
                "Yes" if clip.is_approved else "No",
                clip.user_notes or ""
            ])
    return path

def export_json(clips: List[Clip]) -> str:
    fd, path = tempfile.mkstemp(suffix=".json")
    data = []
    for clip in clips:
        data.append({
            "start_time": clip.start_time,
            "end_time": clip.end_time,
            "title": clip.title,
            "category": clip.category,
            "confidence": clip.confidence,
            "reason": clip.reason,
            "is_approved": clip.is_approved,
            "user_notes": clip.user_notes
        })
        
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    return path

def export_srt(clips: List[Clip]) -> str:
    fd, path = tempfile.mkstemp(suffix=".srt")
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        for idx, clip in enumerate(clips, 1):
            # SRT format requires comma for ms: 00:00:00,000
            start = clip.start_time.replace(".", ",") + ",000" if "," not in clip.start_time else clip.start_time
            end = clip.end_time.replace(".", ",") + ",000" if "," not in clip.end_time else clip.end_time
            
            f.write(f"{idx}\n")
            f.write(f"{start} --> {end}\n")
            f.write(f"[{clip.category.upper()}] {clip.title}\n\n")
    return path
