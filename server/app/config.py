import sys
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import ValidationError
from typing import Optional

class Settings(BaseSettings):
    # Database URL (Required)
    DATABASE_URL: str

    # Cloudinary Credentials for Image Storage (Required for inventory feature)
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # Groq AI Credentials for Description Generation (Required for inventory feature)
    GROQ_API_KEY: str
    GROQ_MODEL_NAME: str = "llama-3.1-8b-instant"

    # --- ADD CLERK KEY ---
    CLERK_SECRET_KEY: str # Required for authentication

    # Security Key (Optional for now, as you requested)
    SECRET_KEY: Optional[str] = None

    # Pydantic V2 configuration to load from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8'
    )

# --- UPDATED ERROR MESSAGE ---
try:
    settings = Settings()
    print("✅ Configuration (.env) loaded successfully!")
except ValidationError as e:
    print("❌ FATAL ERROR: Missing or invalid environment variables in .env file.")
    # Added CLERK_SECRET_KEY to the list of required variables
    print("Please ensure DATABASE_URL, CLOUDINARY_..., GROQ_API_KEY, and CLERK_SECRET_KEY are set.")
    print(e)
    sys.exit(1)