import httpx
import json
import re
import asyncio
from typing import List, Optional, Callable, Dict, Any, Awaitable
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

async def analyze_transcript(transcript: str, rubric_rules: Optional[List[str]] = None, progress_callback: Optional[Callable[[float], Awaitable[None]]] = None) -> Dict[str, Any]:
    # Very crude token estimation
    estimated_tokens = len(transcript) / 4
    
    # Simple chunking for very long transcripts (not full robust 30m chunk logic for brevity but sufficient struct)
    chunks = []
    # Drastically lowered threshold for free-tier rate limits (approx 3k tokens)
    if estimated_tokens > 3000:
        # Split into ~12k char chunks to stay well within free tier TPM limits
        chunk_size = 12000
        for i in range(0, len(transcript), chunk_size):
            # Include an overlap for continuity across chunks
            end_idx = min(i + chunk_size + 1000, len(transcript))
            chunks.append(transcript[i:end_idx])
    else:
        chunks = [transcript]
        
    all_clips = []
    total_clips = 0
    video_summary = ""
    
    for idx, chunk in enumerate(chunks):
        if idx > 0:
            # Mandatory cooldown to respect Free Tier Tokens Per Minute (TPM) limits
            await asyncio.sleep(5)
            
        if progress_callback:
            await progress_callback((idx / len(chunks)) * 100)
            
        custom_rules = "\nCUSTOM RUBRIC RULES:\n" + "\n".join(f"- {r}" for r in rubric_rules) if rubric_rules else ""
        
        user_prompt = f"""Analyze this SECTION of a video transcript (Chunk {idx+1}/{len(chunks)}) and find clip-worthy moments.
{custom_rules}

TRANSCRIPT SECTION:
{chunk}

Return a JSON object with this EXACT structure:
{{
  "clips": [
    {{
      "start_time": "HH:MM:SS",
      "end_time": "HH:MM:SS", 
      "title": "Short descriptive title",
      "category": "highlight|funny|emotional|key_point|topic_change|action_item|quote",
      "confidence": 85,
      "reason": "Why this is clip-worthy"
    }}
  ],
  "video_summary": "Brief summary of this SECTION"
}}"""

        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "api-key": settings.openrouter_api_key
        }
        
        payload = {
            "model": settings.ai_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 2000
        }
        
        chunk_clips = []
        chunk_summary = ""
        success = False
        last_error = None
        
        # Retry with exponential backoff and explicit Rate Limit handling
        for attempt, delay in enumerate([5, 15, 30]):
            try:
                print(f"DEBUG: [CHUNK {idx}] Sending to AI (Attempt {attempt+1})...")
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{settings.openrouter_base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                        timeout=180.0
                    )
                    
                    if response.status_code == 429:
                        print(f"DEBUG: [CHUNK {idx}] Rate Limited. Waiting {delay}s...")
                        await asyncio.sleep(delay)
                        continue

                    print(f"DEBUG: [CHUNK {idx}] AI Response Status: {response.status_code}")
                    if response.status_code != 200:
                        print(f"DEBUG: [CHUNK {idx}] Error Body: {response.text}")
                        
                    response.raise_for_status()
                    result = response.json()
                    
                    content = result["choices"][0]["message"]["content"].strip()
                    
                    # Parse JSON
                    try:
                        data = json.loads(content)
                    except json.JSONDecodeError:
                        match = re.search(r"```(?:json)?(.*?)```", content, re.DOTALL)
                        if match:
                            data = json.loads(match.group(1).strip())
                        else:
                            content_cleaned = re.sub(r"^[^{]*", "", content)
                            content_cleaned = re.sub(r"[^}]*$", "", content_cleaned)
                            data = json.loads(content_cleaned)
                    
                    if "clips" in data:
                        chunk_clips = data["clips"]
                    if "video_summary" in data:
                        chunk_summary = data["video_summary"]
                        
                    success = True
                    break
            except Exception as e:
                last_error = e
                print(f"DEBUG: [CHUNK {idx}] Attempt {attempt+1} failed: {str(e)}")
                await asyncio.sleep(delay)
                
        if not success:
            raise AnalysisError(f"AI Analysis failed after retries: {str(last_error)}")
            
        all_clips.extend(chunk_clips)
        if not video_summary and chunk_summary:
            video_summary = chunk_summary
            
    if progress_callback:
        await progress_callback(100.0)

    # Simple deduplication could go here for overlapping clips
    return {
        "clips": all_clips,
        "total_clips": len(all_clips),
        "video_summary": video_summary
    }
