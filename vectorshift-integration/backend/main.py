from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from typing import Optional
import os
import logging

# Import our HubSpot integration functions
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from integrations.hubspot import authorize_hubspot, oauth2callback_hubspot, get_contacts_from_hubspot  # type: ignore
from integrations.utils import check_redis_connection  # type: ignore

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="VectorShift HubSpot Integration",
    description="HubSpot OAuth2 integration for VectorShift platform",
    version="1.0.0"
)

# Enable CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/ping")
async def ping():
    return {"message": "pong"}

# Redis health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint that tests Redis connectivity and provides Windows-specific guidance.
    
    Returns:
        dict: Health status including Redis connection status and Windows guidance
    """
    redis_status = check_redis_connection()
    
    health_info = {
        "api_status": "healthy",
        "redis_connected": redis_status,
        "timestamp": __import__('datetime').datetime.utcnow().isoformat(),
    }
    
    # Add Windows-specific guidance if Redis is not connected
    if not redis_status:
        health_info["redis_guidance"] = {
            "status": "Redis not available - using in-memory fallback",
            "windows_install_options": [
                "Option 1: Install Redis via Microsoft Store (search 'Redis')",
                "Option 2: Use Chocolatey - 'choco install redis-64'", 
                "Option 3: Use WSL2 - 'wsl --install' then 'sudo apt install redis-server'",
                "Option 4: Use Docker - 'docker run -d -p 6379:6379 redis:alpine'"
            ],
            "alternative": "Application will work with in-memory storage for development"
        }
    
    return health_info

# Root endpoint
@app.get("/")
async def root():
    return {"message": "VectorShift HubSpot Integration API", "status": "running"}

# HubSpot OAuth Routes
@app.get("/api/integrations/hubspot/authorize")
def hubspot_authorize(user_id: str = Query(default="test_user", description="User ID for OAuth session")):
    """
    Initiate HubSpot OAuth2 authorization flow.
    
    This endpoint redirects the user to HubSpot's authorization page where they can
    grant permission to access their CRM data.
    
    Args:
        user_id (str): Unique identifier for the user requesting authorization
        
    Returns:
        RedirectResponse: Redirect to HubSpot authorization page
    """
    try:
        logger.info(f"🚀 Starting HubSpot OAuth for user: {user_id}")
        
                # Call our authorization function
        redirect_response = authorize_hubspot(user_id)

        logger.info(f"✅ OAuth authorization initiated for user: {user_id}")
        return redirect_response
        
    except Exception as e:
        logger.error(f"❌ OAuth authorization failed for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate OAuth authorization: {str(e)}"
        )

@app.get("/api/integrations/hubspot/callback")
async def hubspot_callback(
    code: str = Query(..., description="Authorization code from HubSpot"),
    state: str = Query(default="test_user", description="State parameter containing user ID"),
    error: Optional[str] = Query(default=None, description="Error parameter if authorization failed")
):
    """
    Handle HubSpot OAuth2 callback and exchange code for tokens.
    
    This endpoint receives the authorization code from HubSpot's redirect,
    exchanges it for access and refresh tokens, and stores them securely.
    
    Args:
        code (str): Authorization code from HubSpot callback
        state (str): State parameter containing user_id
        error (str): Error parameter if authorization was denied
        
    Returns:
        dict: Success response with user information
    """
    try:
        # Check if user denied authorization
        if error:
            logger.warning(f"⚠️ OAuth authorization denied for user {state}: {error}")
            # Redirect back to frontend with error parameter
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            redirect_url = f"{frontend_url}/?oauth_error=authorization_denied"
            return RedirectResponse(url=redirect_url, status_code=302)
        
        logger.info(f"🔄 Processing HubSpot OAuth callback for user: {state}")
        logger.info(f"📝 Authorization code received: {code[:10]}...")
        
        # Call our callback function to exchange code for tokens
        result = await oauth2callback_hubspot(code, state)
        
        logger.info(f"🎉 OAuth callback completed successfully for user: {state}")
        
        # Redirect back to frontend with success parameter
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        redirect_url = f"{frontend_url}/?oauth_success=true&user_id={state}"
        
        logger.info(f"🔄 Redirecting to frontend: {redirect_url}")
        return RedirectResponse(url=redirect_url, status_code=302)
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"❌ OAuth callback failed for user {state}: {str(e)}")
        # Redirect back to frontend with error parameter
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        redirect_url = f"{frontend_url}/?oauth_error=callback_failed"
        return RedirectResponse(url=redirect_url, status_code=302)

# HubSpot Data Endpoints
@app.get("/api/integrations/hubspot/contacts")
async def get_hubspot_contacts(user_id: str = Query(default="test_user", description="User ID to fetch contacts for")):
    """
    Fetch HubSpot contacts for the authenticated user.
    
    This endpoint retrieves the user's HubSpot contacts using their stored access token.
    It handles token refresh automatically if the access token has expired.
    
    Args:
        user_id (str): Unique identifier for the user whose contacts to fetch
        
    Returns:
        dict: List of contacts with success status
    """
    try:
        logger.info(f"📋 Fetching HubSpot contacts for user: {user_id}")
        
        # Call our contacts fetching function
        contacts_data = await get_contacts_from_hubspot(user_id)
        
        logger.info(f"✅ Successfully fetched {len(contacts_data.get('contacts', []))} contacts for user: {user_id}")
        
        return {
            "success": True,
            "user_id": user_id,
            "data": contacts_data
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"❌ Failed to fetch contacts for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch HubSpot contacts: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    # Get port from environment or default to 8000
    port = int(os.getenv("PORT", 8000))
    logger.info(f"🚀 Starting VectorShift HubSpot Integration API on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 