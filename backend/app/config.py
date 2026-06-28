import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "sqlite:///./devtool.db"

    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # gemini, openai, ollama
    LLM_MODEL: str = "gemini-2.5-flash"

    # API Keys & URLs
    GOOGLE_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_API_BASE: str = "https://api.openai.com/v1"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    # Vector Store & Embedding Settings
    EMBEDDING_PROVIDER: str = "local"  # local, gemini
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    FAISS_INDEX_PATH: str = "faiss_index"

    # Exports Directory
    EXPORTS_DIR: str = "exports"

    # Pydantic Configuration
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# Ensure critical directories exist
os.makedirs(settings.FAISS_INDEX_PATH, exist_ok=True)
os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
