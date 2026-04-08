import httpx
from config import settings

class TranslationError(Exception):
    pass

SYSTEM_PROMPT = """
You are a professional translator. Your job is to translate the provided text into the target language while maintaining the original meaning, tone, and formatting.
Do not add any explanations or commentary. Just return the translated text.
"""

async def translate_text(text: str, target_language: str) -> str:
    if not text.strip():
        return ""

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": settings.ai_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"TARGET LANGUAGE: {target_language}\n\nTEXT TO TRANSLATE:\n{text}"}
        ],
        "temperature": 0.3,
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
        print(f"Translation failed: {str(e)}")
        raise TranslationError(f"AI Translation failed: {str(e)}")
