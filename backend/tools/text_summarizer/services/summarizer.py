import httpx
import json
from typing import Optional
from config import settings

class SummarizationError(Exception):
    pass

SYSTEM_PROMPT = """
You are a professional content editor. Your job is to summarize provided text accurately while maintaining the original tone and key information.
"""

async def summarize_text(text: str, style: str = "balanced") -> str:
    if not text.strip():
        return ""

    styles = {
        "concise": "Provide a very short, bulleted summary (3-5 points). focus on only the most critical facts.",
        "balanced": "Provide a well-rounded 2-3 paragraph summary that covers all main points.",
        "detailed": "Provide a comprehensive summary, preserving important details, examples, and context."
    }

    style_guide = styles.get(style, styles["balanced"])

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": settings.ai_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"{style_guide}\n\nTEXT TO SUMMARIZE:\n{text}"}
        ],
        "temperature": 0.5,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Summarization failed: {str(e)}")
        raise SummarizationError(f"AI Summarization failed: {str(e)}")
