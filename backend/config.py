import os
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

class Settings(BaseSettings):
    app_name: str = Field("ToolboxHub", env="APP_NAME")
    app_version: str = Field("1.0.0", env="APP_VERSION")
    debug: bool = Field(True, env="DEBUG")
    
    database_url: str = Field("sqlite:///./toolbox_hub.db", env="DATABASE_URL")
    mongodb_uri: str = Field("mongodb://localhost:27017", env="MONGODB_URI")
    jwt_secret: str = Field("SUPER_SECRET_CHANGE_ME", env="JWT_SECRET")
    jwt_algorithm: str = Field("HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(10080, env="ACCESS_TOKEN_EXPIRE_MINUTES") # 7 days
    
    google_client_id: str = Field("", env="GOOGLE_CLIENT_ID")
    stripe_secret_key: str = Field("", env="STRIPE_SECRET_KEY")
    stripe_webhook_secret: str = Field("", env="STRIPE_WEBHOOK_SECRET")
    stripe_pro_monthly_id: str = Field("", env="STRIPE_PRO_MONTHLY_ID")
    stripe_ent_monthly_id: str = Field("", env="STRIPE_ENT_MONTHLY_ID")
    
    cors_origins: str = Field("http://localhost:3000,http://127.0.0.1:3000", env="CORS_ORIGINS")
    upload_dir: str = Field("./uploads", env="UPLOAD_DIR")
    max_file_size_mb: int = Field(2048, env="MAX_FILE_SIZE_MB")
    
    openrouter_api_key: str = Field("", env="OPENROUTER_API_KEY")
    openrouter_base_url: str = Field("https://openrouter.ai/api/v1", env="OPENROUTER_BASE_URL")
    ai_model: str = Field("qwen/qwen-2.5-72b-instruct:free", env="AI_MODEL")
    groq_api_key: str = Field("", env="GROQ_API_KEY")
    groq_base_url: str = Field("https://api.groq.com/openai/v1", env="GROQ_BASE_URL")

    @field_validator("openrouter_api_key", "groq_api_key", "ai_model", mode="before")
    @classmethod
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Ensure base upload dir exists
os.makedirs(settings.upload_dir, exist_ok=True)
