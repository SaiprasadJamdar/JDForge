import os
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Groq
    groq_api_key: str
    google_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # Database
    database_url: str = "postgresql://postgres:abc123@localhost:5432/jdforge"

    # JWT & Security
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    encryption_key: str = "3f3z_9_S1-7-xXJj8A2Z-vE7m6hR_4fN5sL6k7m8n9o=" # 32 bytes base64

    # Zoho Recruit Mock API
    zoho_base_url: str = "https://zohorecruit.thankfulrock-f57331b9.centralindia.azurecontainerapps.io"
    
    # CORS Origin
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "" # Set this to your public Render URL (e.g., https://api.jdforge.com)

    # Email / OTP -- set via env vars (SMTP_USER, SMTP_PASSWORD)
    # Gmail: Account -> Security -> 2-Step Verification -> App Passwords
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""        # set SMTP_USER=yourapp@gmail.com in .env
    smtp_password: str = ""    # set SMTP_PASSWORD=<16-char app password> in .env
    smtp_from_name: str = "JDForge"
    otp_expire_minutes: int = 10


    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    # Normalize Supabase URLs (SQLAlchemy 1.4+ requires 'postgresql://', but Supabase often gives 'postgres://')
    if settings.database_url.startswith("postgres://"):
        settings.database_url = settings.database_url.replace("postgres://", "postgresql://", 1)
    return settings
