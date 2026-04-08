import httpx
import json
import re
import asyncio
from typing import List, Optional, Callable, Dict, Any
from config import settings

class AnalysisError(Exception):
    pass

SYSTEM_PROMPT = """
You are ClipMaster AI — a professional video editor and content strategist.
Your job is to analyze video transcripts and identify ALL moments worth clipping.

RULES:
1. Identify: highlights, funny moments, emotional moments, key points, 
   topic changes, quotable lines, action items
2. Each clip should be 15 seconds to 3 minutes long
3. Prefer natural breakpoints in conversation
4. Assign confidence scores honestly (0-100):
   - 90-100: Must-clip, incredibly strong moment
   - 70-89: Very good clip, recommended
   - 50-69: Decent clip, optional
   - Below 50: Weak, only include if explicitly requested
5. Provide clear 1-2 line reasons for each suggestion
6. Never overlap clips unless absolutely necessary
7. Cover the ENTIRE video — don't skip sections
8. If the video is educational, focus on key takeaways
9. If the video is entertainment, focus on funny/emotional peaks
10. Return ONLY valid JSON — no markdown, no explanations outside JSON
"""

async def analyze_transcript(transcript: str, rubric_rules: Optional[List[str]] = None, progress_callback: Optional[Callable[[float], None]] = None) -> Dict[str, Any]:
    # Very crude token estimation
    estimated_tokens = len(transcript) / 4
    
    # Simple chunking for very long transcripts (not full robust 30m chunk logic for brevity but sufficient struct)
    chunks = []
    if estimated_tokens > 100000:
        # Split into ~80k char chunks (roughly 20k tokens)
        chunk_size = 80000
        for i in range(0, len(transcript), chunk_size):
            # Include an artificial overlap
            end_idx = min(i + chunk_size + 4000, len(transcript))
            chunks.append(transcript[i:end_idx])
    else:
        chunks = [transcript]
        
    all_clips = []
    total_clips = 0
    video_summary = ""
    
    for idx, chunk in enumerate(chunks):
        if progress_callback:
            progress_callback((idx / len(chunks)) * 100)
            
        custom_rules = "\nCUSTOM RUBRIC RULES:\n" + "\n".join(f"- {r}" for r in rubric_rules) if rubric_rules else ""
        
        user_prompt = f"""Analyze this video transcript and find ALL clip-worthy moments.
{custom_rules}

TRANSCRIPT:
{chunk}

Return a JSON object with this EXACT structure:
{{
  "clips": [
    {{
      "start_time": "HH:MM:SS",
      "end_time": "HH:MM:SS", 
      "title": "Short descriptive title (max 60 chars)",
      "category": "highlight|funny|emotional|key_point|topic_change|action_item|quote",
      "confidence": 85,
      "reason": "Why this is clip-worthy (1-2 lines)"
    }}
  ],
  "total_clips": 15,
  "video_summary": "Brief 2-3 line video summary"
}}"""

        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": settings.ai_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 4000 # reduced max tokens so response fits
        }
        
        chunk_clips = []
        chunk_summary = ""
        success = False
        last_error = None
        
        # Retry with exponential backoff
        for attempt, delay in enumerate([2, 4, 8]):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{settings.openrouter_base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                        timeout=180.0
                    )
                    response.raise_for_status()
                    result = response.json()
                    
                    content = result["choices"][0]["message"]["content"].strip()
                    
                    # Parse JSON
                    try:
                        data = json.loads(content)
                    except json.JSONDecodeError:
                        # try extracting from markdown
                        match = re.search(r"```(?:json)?(.*?)```", content, re.DOTALL)
                        if match:
                            data = json.loads(match.group(1).strip())
                        else:
                            # fallback: find curly braces
                            start = content.find('{')
                            end = content.rfind('}') + 1
                            if start != -1 and end != 0:
                                data = json.loads(content[start:end])
                            else:
                                raise AnalysisError("Could not extract JSON from response")
                    
                    if "clips" in data:
                        chunk_clips = data["clips"]
                    if "video_summary" in data:
                        chunk_summary = data["video_summary"]
                        
                    success = True
                    break
            except Exception as e:
                last_error = e
                await asyncio.sleep(delay)
                
        if not success:
            raise AnalysisError(f"AI Analysis failed after retries: {str(last_error)}")
            
        all_clips.extend(chunk_clips)
        if not video_summary and chunk_summary:
            video_summary = chunk_summary
            
    if progress_callback:
        progress_callback(100.0)

    # Simple deduplication could go here for overlapping clips
    return {
        "clips": all_clips,
        "total_clips": len(all_clips),
        "video_summary": video_summary
    }
