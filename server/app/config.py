import sys
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import ValidationError
from typing import Optional

# Defines the application settings, loading them from a .env file
class Settings(BaseSettings):
    # Database URL (Required)
    DATABASE_URL: str

    # Cloudinary Credentials for Image Storage
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # Groq AI Credentials for Description Generation
    GROQ_API_KEY: str
    # Groq model name, with a default value
    GROQ_MODEL_NAME: str = "llama-3.1-8b-instant" 

    # Security Key
    SECRET_KEY: Optional[str] = None
    
    # Pydantic V2 configuration to load from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8'
    )

# Try to load the settings from the .env file
try:
    settings = Settings()
    print("✅ Configuration (.env) loaded successfully!")
except ValidationError as e:
    # If required variables are missing, print an error and exit
    print("❌ FATAL ERROR: Missing or invalid environment variables in .env file.")
    print("Please ensure DATABASE_URL, CLOUDINARY_..., and GROQ_API_KEY are set.")
    print(e)
    sys.exit(1)