from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union, Any
import json
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "UDYAM-SETU API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/grambiz_db"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/grambiz_db"
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "grambiz_ai"
    
    # Multilingual / Bhashini / IndicTrans2
    BHASHINI_API_URL: str = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    BHASHINI_API_KEY: str = ""
    BHASHINI_USER_ID: str = ""
    BHASHINI_PIPELINE_ID: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET: str = "super-secret-grambiz-jwt-key-change-in-prod-1234567890"
    JWT_REFRESH_SECRET: str = "super-secret-grambiz-jwt-refresh-key-change-in-prod-1234567890"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: Any = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_clean = v.strip()
            if v_clean.startswith("[") and v_clean.endswith("]"):
                try:
                    return json.loads(v_clean)
                except Exception:
                    pass
            if "," in v_clean:
                return [i.strip() for i in v_clean.split(",") if i.strip()]
            return [v_clean]
        if isinstance(v, (list, tuple)):
            return list(v)
        return ["*"]

    # AI Providers
    LLM_PROVIDER: str = "gemini"
    LLM_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"
    EMBEDDING_PROVIDER: str = "gemini"
    EMBEDDING_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow"
    )

settings = Settings()
