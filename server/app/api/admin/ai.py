from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from groq import Groq

# Updated relative imports to go back up two levels to reach config
from ...config import settings  
from ..auth import get_current_user

# The router is protected so only authorized admins can call the AI service
router = APIRouter(dependencies=[Depends(get_current_user)])

# --- INTERNAL SCHEMAS ---

class DescriptionRequest(BaseModel):
    """
    Schema for the AI description generation request.
    """
    product_name: str
    category: str | None = None

# --- ENDPOINTS ---

@router.post("/generate-description", response_model=dict)
async def generate_ai_description(request: DescriptionRequest):
    """
    Generates a high-conversion e-commerce product description using the Groq AI Engine.
    """
    # Safety check for API configuration
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI Service is currently unavailable: API Key not configured."
        )

    try:
        # Initialize Groq Client
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        # Engineering the prompt for consistent results
        prompt = (
            f"Generate a compelling and concise e-commerce product description in about 30-50 words "
            f"for a product named '{request.product_name}'"
        )
        
        if request.category:
            prompt += f" categorized under '{request.category}'"
        
        prompt += (
            ". Highlight its key features and unique selling points. "
            "Use a professional yet engaging tone. Do not use hashtags or emojis."
        )

        # AI Inference Call
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=settings.GROQ_MODEL_NAME or "mixtral-8x7b-32768",
            temperature=0.7,
            max_tokens=150,
        )
        
        # Extraction
        ai_response = chat_completion.choices[0].message.content.strip()
        
        # Log success internally (Optional)
        print(f"🤖 AI Description generated for: {request.product_name}")
        
        return {"description": ai_response}

    except Exception as e:
        # Catch connection errors or Groq rate limits
        print(f"❌ Error during Groq Inference: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Engine is overloaded or disconnected. Please try again later."
        )