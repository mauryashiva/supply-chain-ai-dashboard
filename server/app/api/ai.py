from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from groq import Groq

from ..config import settings  # Import app settings (for API keys)

router = APIRouter()

# Defines the expected request body structure from the frontend
class DescriptionRequest(BaseModel):
    product_name: str
    category: str | None = None

@router.post("/generate-description", response_model=dict)
async def generate_ai_description(request: DescriptionRequest):
    """
    Generates a product description using Groq AI.
    """
    # Check if the Groq API key is set in the environment variables
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GROQ_API_KEY is not configured in the .env file."
        )

    try:
        # Initialize the Groq client
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        # Construct the prompt for the AI model
        prompt = (
            f"Generate a compelling and concise e-commerce product description in about 30-50 words "
            f"for a product named '{request.product_name}'"
        )
        if request.category:
            prompt += f" in the category '{request.category}'"
        
        prompt += ". Highlight its key features and benefits for the customer. Do not use hashtags."

        # Call the Groq Chat Completions API
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=settings.GROQ_MODEL_NAME, # Use the model name from settings
            temperature=0.7,
            max_tokens=100,
        )
        
        # Extract and clean up the generated description
        description = chat_completion.choices[0].message.content.strip()
        return {"description": description}

    except Exception as e:
        # Handle any errors during the API call
        print(f"Error calling Groq API: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate description from AI service."
        )