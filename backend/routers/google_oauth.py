from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
import httpx, os
from urllib.parse import urlencode
from jose import jwt
import asyncpg
from database.connection import db_manager

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

async def get_db_pool():
    """Dependency to get database pool"""
    pool = db_manager.get_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not available")
    return pool

@router.get("/auth/google/login")
async def google_login():
    """Redirect to Google OAuth login"""
    if not GOOGLE_CLIENT_ID:
        return JSONResponse({"error": "Google OAuth not configured"}, status_code=500)
    
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "response_type": "code",
        "scope": "openid email profile",
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "access_type": "offline",
        "prompt": "consent"
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url)

@router.get("/auth/google/callback")
async def google_callback(request: Request, pool=Depends(get_db_pool)):
    """Handle Google OAuth callback"""
    code = request.query_params.get("code")
    error = request.query_params.get("error")
    
    if error:
        return RedirectResponse("http://localhost:5173?error=access_denied")
    
    if not code:
        return RedirectResponse("http://localhost:5173?error=no_code")
    
    try:
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code"
                }
            )
            
            if token_resp.status_code != 200:
                return RedirectResponse("http://localhost:5173?error=token_exchange_failed")
            
            token_data = token_resp.json()
            id_token = token_data.get("id_token")
            
            if not id_token:
                return RedirectResponse("http://localhost:5173?error=no_id_token")
            
            # Decode user info from ID token
            user_info = jwt.get_unverified_claims(id_token)
            email = user_info.get("email")
            name = user_info.get("name", "")
            
            if not email:
                return RedirectResponse("http://localhost:5173?error=no_email")
            
            # Check if account exists in database
            async with pool.acquire() as connection:
                existing_account = await connection.fetchrow(
                    "SELECT user_id, email, name FROM accounts WHERE email = $1", email
                )
                
                if existing_account:
                    user_id = existing_account['user_id']
                else:
                    # Create new account first (main table)
                    user_id = await connection.fetchval(
                        "INSERT INTO accounts (email, name) VALUES ($1, $2) RETURNING user_id",
                        email, name
                    )
                
                # Check if user game data exists
                existing_user = await connection.fetchrow(
                    "SELECT user_id FROM users WHERE user_id = $1", user_id
                )
                
                if not existing_user:
                    # Create user game data
                    await connection.execute(
                        "INSERT INTO users (user_id, poin, rank) VALUES ($1, $2, $3)",
                        user_id, 0, "beginner"
                    )
            
            # Store user_id in query parameter for frontend to detect
            return RedirectResponse(f"http://localhost:5173?login_success={user_id}")
            
    except Exception as e:
        print(f"OAuth error: {e}")
        return RedirectResponse(f"http://localhost:5173?error=server_error")

@router.get("/auth/user/{user_id}")
async def get_user_info(user_id: int, pool=Depends(get_db_pool)):
    """Get user information"""
    try:
        async with pool.acquire() as connection:
            user = await connection.fetchrow(
                """
                SELECT a.user_id, a.email, a.name, a.is_panitia, u.poin, u.rank 
                FROM accounts a 
                LEFT JOIN users u ON a.user_id = u.user_id 
                WHERE a.user_id = $1
                """, 
                user_id
            )
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            return {"status": "success", "user": dict(user)}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")