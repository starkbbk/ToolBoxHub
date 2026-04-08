from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from shared.response import success_response, error_response
from tools.text_summarizer.services.summarizer import summarize_text, SummarizationError
from tools.text_summarizer.services.translator import translate_text, TranslationError

router = APIRouter()

class SummarizeRequest(BaseModel):
    text: str
    style: str = "balanced"

class TranslateRequest(BaseModel):
    text: str
    target_language: str

@router.post("/summarize")
async def handle_summarize(request: SummarizeRequest):
    if not request.text or len(request.text) < 10:
        raise HTTPException(status_code=400, detail="Text is too short to summarize")
    
    try:
        summary = await summarize_text(request.text, request.style)
        return success_response({"summary": summary})
    except SummarizationError as e:
        return error_response(str(e), status_code=500)
    except Exception as e:
        return error_response(f"An unexpected error occurred: {str(e)}", status_code=500)

@router.post("/translate")
async def handle_translate(request: TranslateRequest):
    if not request.text or len(request.text) < 2:
        raise HTTPException(status_code=400, detail="Text is too short to translate")
    
    try:
        translated = await translate_text(request.text, request.target_language)
        return success_response({"translatedText": translated})
    except TranslationError as e:
        return error_response(str(e), status_code=500)
    except Exception as e:
        return error_response(f"An unexpected error occurred: {str(e)}", status_code=500)
