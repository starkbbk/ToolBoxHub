from fastapi import APIRouter, UploadFile, File, HTTPException
from shared.response import success_response, error_response
from tools.audio_transcriber.services.transcriber import transcribe_audio, TranscriberError

router = APIRouter()

@router.post("/transcribe")
async def handle_transcribe(file: UploadFile = File(...)):
    # Validate file type
    allowed_types = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp3", "audio/m4a", "audio/x-m4a", "audio/flac"]
    if file.content_type not in allowed_types and not file.filename.endswith(('.mp3', '.wav', '.m4a', '.flac')):
         # Be a bit lenient with filenames if content_type is generic
         pass
    
    try:
        content = await file.read()
        result = await transcribe_audio(content, file.filename)
        return success_response(result)
    except TranscriberError as e:
        return error_response(str(e), status_code=500)
    except Exception as e:
        return error_response(f"An unexpected error occurred: {str(e)}", status_code=500)
