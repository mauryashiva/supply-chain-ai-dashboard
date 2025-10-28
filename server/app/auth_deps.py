from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from clerk_sdk_python import Clerk
from .config import settings

# Clerk client ko initialize karein (aapke .env se SECRET_KEY uthayega)
clerk_client = Clerk(secret_key=settings.CLERK_SECRET_KEY)

# Yeh batata hai ki token ko "Authorization: Bearer <TOKEN>" header se lena hai
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") 

async def get_current_user_claims(request: Request) -> dict:
    """
    Token ko verify karta hai aur user ka data (claims) return karta hai.
    Yeh hamara naya 'security guard' hai.
    """
    try:
        # Request se "Authorization" header nikaalein
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Missing Authorization header"
            )
        
        # "Bearer " prefix hatakar token nikaalein
        token = auth_header.split(" ")[1]
        
        # Token ko Clerk ke servers se verify karein
        claims = clerk_client.sessions.verify_token(token)
        
        if not claims:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Aap yahan user ID (claims['sub']) ya doosri details access kar sakte hain
        return claims
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )