import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = Field("ToolboxHub", env="APP_NAME")
    app_version: str = Field("1.0.0", env="APP_VERSION")
    debug: bool = Field(True, env="DEBUG")
    
    database_url: str = Field("sqlite:///./toolbox_hub.db", env="DATABASE_URL")
    cors_origins: str = Field("http://localhost:3000,http://127.0.0.1:3000", env="CORS_ORIGINS")
    upload_dir: str = Field("./uploads", env="UPLOAD_DIR")
    max_file_size_mb: int = Field(2048, env="MAX_FILE_SIZE_MB")
    
    openrouter_api_key: str = Field("", env="OPENROUTER_API_KEY")
    openrouter_base_url: str = Field("https://openrouter.ai/api/v1", env="OPENROUTER_BASE_URL")
    ai_model: str = Field("qwen/qwen3.6-plus:free", env="AI_MODEL")
    groq_api_key: str = Field("", env="GROQ_API_KEY")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Ensure base upload dir exists
os.makedirs(settings.upload_dir, exist_ok=True)
