import os
import uuid

def generate_uuid() -> str:
    return str(uuid.uuid4())

def generate_uuid_filename(original_filename: str) -> str:
    ext = os.path.splitext(original_filename)[1].lower()
    return f"{uuid.uuid4()}{ext}"

def get_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()

def get_file_size(filepath: str) -> int:
    try:
        return os.path.getsize(filepath)
    except OSError:
        return 0

def cleanup_file(filepath: str):
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
        except OSError:
            pass
