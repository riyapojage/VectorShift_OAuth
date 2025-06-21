import os
from urllib.parse import urlencode
from fastapi import HTTPException
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
import httpx
import logging
from .utils import save_credentials, load_credentials

# Explicit exports for linter
__all__ = [
    "authorize_hubspot",
    "oauth2callback_hubspot",
    "get_contacts_from_hubspot",
    "refresh_access_token",
    "exchange_code_for_tokens",
    "fetch_hubspot_contacts"
]

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# HubSpot OAuth Configuration
HUBSPOT_CLIENT_ID = os.getenv("HUBSPOT_CLIENT_ID")
HUBSPOT_CLIENT_SECRET = os.getenv("HUBSPOT_CLIENT_SECRET")
HUBSPOT_AUTH_URL = "https://app.hubspot.com/oauth/authorize"
HUBSPOT_TOKEN_URL = "https://api.hubapi.com/oauth/v1/token"

# OAuth Scopes - what permissions we're requesting
# Must match exactly what's configured in your HubSpot app
HUBSPOT_SCOPES = "crm.objects.contacts.read"

# Redirect URI - where HubSpot sends users back after authorization  
# This should point to our backend API callback route for direct token exchange
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:8000/api/integrations/hubspot/callback")

def authorize_hubspot(user_id: str = "test_user") -> RedirectResponse:
    """
    Initiates HubSpot OAuth2 authorization flow.
    
    This function creates the authorization URL that redirects users to HubSpot's
    permission screen where they can grant access to their CRM data.
    
    Args:
        user_id (str): Unique identifier for the user requesting authorization
        
    Returns:
        RedirectResponse: FastAPI redirect to HubSpot authorization page
        
    Raises:
        HTTPException: If required environment variables are missing
    """
    
    # Validate required environment variables
    if not HUBSPOT_CLIENT_ID:
        logger.error("HUBSPOT_CLIENT_ID not found in environment variables")
        raise HTTPException(
            status_code=500, 
            detail="HubSpot Client ID not configured. Please check environment variables."
        )
    
    if not HUBSPOT_CLIENT_SECRET:
        logger.error("HUBSPOT_CLIENT_SECRET not found in environment variables")
        raise HTTPException(
            status_code=500, 
            detail="HubSpot Client Secret not configured. Please check environment variables."
        )
    
    # Build OAuth2 authorization parameters
    auth_params = {
        "client_id": HUBSPOT_CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": HUBSPOT_SCOPES,
        "response_type": "code",  # We want an authorization code
        "state": user_id  # Include user_id in state for security and tracking
    }
    
    # Construct the full authorization URL
    auth_url = f"{HUBSPOT_AUTH_URL}?{urlencode(auth_params)}"
    
    logger.info(f"🚀 Initiating OAuth for user {user_id}")
    logger.info(f"🔗 Redirecting to: {auth_url}")
    
    # Redirect user to HubSpot authorization page
    return RedirectResponse(url=auth_url, status_code=302)

async def oauth2callback_hubspot(code: str, state: str = "test_user") -> dict:
    """
    Handles the OAuth2 callback from HubSpot and exchanges code for tokens.
    
    This function receives the authorization code from HubSpot's redirect,
    exchanges it for access and refresh tokens, and stores them securely.
    
    Args:
        code (str): Authorization code from HubSpot callback
        state (str): State parameter containing user_id
        
    Returns:
        dict: Success response with user information
        
    Raises:
        HTTPException: If token exchange fails or configuration is missing
    """
    
    logger.info(f"🔄 Processing OAuth callback for user: {state}")
    logger.info(f"📝 Authorization code received: {code[:10]}...")
    
    # Validate required environment variables
    if not HUBSPOT_CLIENT_ID or not HUBSPOT_CLIENT_SECRET:
        logger.error("Missing HubSpot credentials in environment variables")
        raise HTTPException(
            status_code=500,
            detail="HubSpot credentials not properly configured"
        )
    
    # Prepare token exchange request data
    token_data = {
        "grant_type": "authorization_code",
        "client_id": HUBSPOT_CLIENT_ID,
        "client_secret": HUBSPOT_CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "code": code
    }
    
    # DEBUG: Log the exact data being sent
    logger.info(f"🔍 DEBUG - Token exchange data:")
    logger.info(f"🔍 client_id: {HUBSPOT_CLIENT_ID}")
    logger.info(f"🔍 redirect_uri: {REDIRECT_URI}")
    logger.info(f"🔍 code: {code}")
    logger.info(f"🔍 grant_type: authorization_code")
    
    try:
        # Exchange authorization code for access tokens
        async with httpx.AsyncClient() as client:
            logger.info("🔄 Exchanging authorization code for access tokens...")
            
            response = await client.post(
                HUBSPOT_TOKEN_URL,
                data=token_data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
            
            # Check if request was successful
            if response.status_code != 200:
                logger.error(f"❌ Token exchange failed: {response.status_code}")
                logger.error(f"❌ Response: {response.text}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to exchange code for tokens: {response.text}"
                )
            
            # Parse token response
            token_response = response.json()
            logger.info("✅ Successfully received tokens from HubSpot")
            
            # Extract tokens from response
            access_token = token_response.get("access_token")
            refresh_token = token_response.get("refresh_token")
            expires_in = token_response.get("expires_in", 21600)  # Default 6 hours
            
            if not access_token:
                logger.error("❌ No access token in HubSpot response")
                raise HTTPException(
                    status_code=400,
                    detail="Invalid token response from HubSpot"
                )
            
            # Prepare credential data for storage
            credentials = {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_in": expires_in,
                "token_type": token_response.get("token_type", "bearer"),
                "scope": token_response.get("scope", HUBSPOT_SCOPES)
            }
            
            # Store credentials in Redis
            logger.info(f"💾 Storing credentials for user: {state}")
            save_credentials(state, credentials)
            
            logger.info(f"🎉 OAuth flow completed successfully for user: {state}")
            
            return {
                "success": True,
                "message": "HubSpot integration completed successfully",
                "user_id": state,
                "scope": credentials["scope"]
            }
            
    except httpx.RequestError as e:
        logger.error(f"❌ Network error during token exchange: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Network error during token exchange: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error during OAuth callback: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during OAuth processing: {str(e)}"
        )

# TODO: Implement token exchange (completed above, keeping for reference)
async def exchange_code_for_tokens(code: str):
    """
    Exchanges authorization code for access and refresh tokens.
    
    Args:
        code (str): Authorization code from HubSpot callback
        
    Returns:
        dict: Token response containing access_token, refresh_token, etc.
    """
    # This functionality is now implemented in oauth2callback_hubspot
    pass

async def refresh_access_token(user_id: str, refresh_token: str) -> dict:
    """
    Refreshes the access token using the refresh token.
    
    This function exchanges a refresh token for a new access token when the current
    access token has expired.
    
    Args:
        user_id (str): Unique identifier for the user
        refresh_token (str): Valid refresh token
        
    Returns:
        dict: New token data or error information
            Success format: {"access_token": "...", "refresh_token": "...", ...}
            Error format: {"error": "message"}
    """
    
    logger.info(f"🔄 Refreshing access token for user: {user_id}")
    
    # Validate required environment variables
    if not HUBSPOT_CLIENT_ID or not HUBSPOT_CLIENT_SECRET:
        logger.error("Missing HubSpot credentials for token refresh")
        return {"error": "HubSpot credentials not configured"}
    
    # Prepare token refresh request data
    refresh_data = {
        "grant_type": "refresh_token",
        "client_id": HUBSPOT_CLIENT_ID,
        "client_secret": HUBSPOT_CLIENT_SECRET,
        "refresh_token": refresh_token
    }
    
    try:
        # Make the token refresh request
        async with httpx.AsyncClient() as client:
            logger.info(f"🔄 Making token refresh request for user: {user_id}")
            
            response = await client.post(
                HUBSPOT_TOKEN_URL,
                data=refresh_data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
            
            # Check if refresh was successful
            if response.status_code == 200:
                # Parse the new token response
                token_response = response.json()
                logger.info(f"✅ Successfully refreshed tokens for user: {user_id}")
                
                # Extract new tokens
                new_access_token = token_response.get("access_token")
                new_refresh_token = token_response.get("refresh_token", refresh_token)  # Fallback to old refresh token
                expires_in = token_response.get("expires_in", 21600)  # Default 6 hours
                
                if not new_access_token:
                    logger.error(f"❌ No access token in refresh response for user: {user_id}")
                    return {"error": "Invalid refresh response"}
                
                # Prepare new credential data
                new_credentials = {
                    "access_token": new_access_token,
                    "refresh_token": new_refresh_token,
                    "expires_in": expires_in,
                    "token_type": token_response.get("token_type", "bearer"),
                    "scope": token_response.get("scope", HUBSPOT_SCOPES)
                }
                
                # Update stored credentials
                save_credentials(user_id, new_credentials)
                
                logger.info(f"💾 Updated credentials with new access token for user: {user_id}")
                
                return new_credentials
                
            else:
                # Refresh failed
                logger.error(f"❌ Token refresh failed {response.status_code} for user {user_id}: {response.text}")
                
                if response.status_code == 400:
                    # Invalid refresh token - user needs to re-authenticate
                    return {"error": "Refresh token expired - please reconnect your HubSpot account"}
                else:
                    return {"error": f"Token refresh failed: {response.status_code}"}
                
    except httpx.RequestError as e:
        logger.error(f"❌ Network error during token refresh for user {user_id}: {str(e)}")
        return {"error": "Network error during token refresh"}
    except Exception as e:
        logger.error(f"❌ Unexpected error during token refresh for user {user_id}: {str(e)}")
        return {"error": "Unexpected error during token refresh"}

async def get_contacts_from_hubspot(user_id: str) -> dict:
    """
    Fetches HubSpot contacts for a specific user using their stored credentials.
    
    This function loads the user's stored OAuth tokens, makes an API call to HubSpot's
    contacts endpoint, and returns the formatted contact data.
    
    Args:
        user_id (str): Unique identifier for the user whose contacts to fetch
        
    Returns:
        dict: Response containing either contact list or error message
            Success format: {"contacts": [...]}
            Error format: {"error": "message"}
            
    Raises:
        HTTPException: For various error conditions (no tokens, API failures)
    """
    
    logger.info(f"📋 Fetching HubSpot contacts for user: {user_id}")
    
    # Step 1: Load user credentials from storage
    credentials = load_credentials(user_id)
    
    if not credentials:
        logger.warning(f"❌ No credentials found for user: {user_id}")
        return {"error": "User not connected"}
    
    # Extract access token from credentials
    access_token = credentials.get("access_token")
    if not access_token:
        logger.error(f"❌ No access token found in credentials for user: {user_id}")
        return {"error": "User not connected"}
    
    # Step 2: Call HubSpot Contacts API
    contacts_url = "https://api.hubapi.com/crm/v3/objects/contacts"
    
    # Define query parameters for the API call
    params = {
        "limit": 10,  # Limit to 10 contacts for this implementation
        "properties": "firstname,lastname,email"  # Only fetch these properties
    }
    
    # Prepare authorization header
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Helper function to make contacts API request
    async def make_contacts_request(access_token: str) -> httpx.Response:
        """Helper function to make the contacts API request."""
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                contacts_url,
                params=params,
                headers=headers
            )
            return response
    
    try:
        # Step 3: Make the initial API request to HubSpot
        logger.info(f"🌐 Making API request to HubSpot for user: {user_id}")
        
        response = await make_contacts_request(access_token)
        
        # Check if the request was successful
        if response.status_code == 200:
            # Parse the JSON response
            api_response = response.json()
            
            # Extract contacts from the response
            raw_contacts = api_response.get("results", [])
            
            # Step 4: Format contacts data
            formatted_contacts = []
            for contact in raw_contacts:
                contact_id = contact.get("id")
                properties = contact.get("properties", {})
                
                # Extract the specific properties we requested
                formatted_contact = {
                    "id": contact_id,
                    "firstname": properties.get("firstname", ""),
                    "lastname": properties.get("lastname", ""),
                    "email": properties.get("email", "")
                }
                
                formatted_contacts.append(formatted_contact)
            
            logger.info(f"✅ Successfully fetched {len(formatted_contacts)} contacts for user: {user_id}")
            
            return {
                "contacts": formatted_contacts,
                "total": len(formatted_contacts)
            }
            
        elif response.status_code == 401:
            # Token expired - attempt to refresh
            logger.warning(f"🔄 Access token expired for user {user_id}, attempting refresh...")
            
            # Get refresh token from credentials
            refresh_token = credentials.get("refresh_token")
            if not refresh_token:
                logger.error(f"❌ No refresh token available for user: {user_id}")
                return {"error": "Token expired, please reconnect."}
            
            # Attempt to refresh the access token
            refresh_result = await refresh_access_token(user_id, refresh_token)
            
            # Check if refresh was successful
            if "error" in refresh_result:
                logger.error(f"❌ Token refresh failed for user {user_id}: {refresh_result['error']}")
                # Return the specific error message requested for token expiry
                return {"error": "Token expired, please reconnect."}
            
            # Get the new access token
            new_access_token = refresh_result.get("access_token")
            if not new_access_token:
                logger.error(f"❌ No new access token received for user: {user_id}")
                return {"error": "Token expired, please reconnect."}
            
            # Retry the contacts request with the new token
            logger.info(f"🔄 Retrying contacts request with refreshed token for user: {user_id}")
            
            retry_response = await make_contacts_request(new_access_token)
            
            if retry_response.status_code == 200:
                # Parse the JSON response
                api_response = retry_response.json()
                
                # Extract contacts from the response
                raw_contacts = api_response.get("results", [])
                
                # Format contacts data
                formatted_contacts = []
                for contact in raw_contacts:
                    contact_id = contact.get("id")
                    properties = contact.get("properties", {})
                    
                    # Extract the specific properties we requested
                    formatted_contact = {
                        "id": contact_id,
                        "firstname": properties.get("firstname", ""),
                        "lastname": properties.get("lastname", ""),
                        "email": properties.get("email", "")
                    }
                    
                    formatted_contacts.append(formatted_contact)
                
                logger.info(f"✅ Successfully fetched {len(formatted_contacts)} contacts after token refresh for user: {user_id}")
                
                return {
                    "contacts": formatted_contacts,
                    "total": len(formatted_contacts),
                    "token_refreshed": True  # Indicate that token was refreshed
                }
            elif retry_response.status_code == 401:
                # Even refreshed token is invalid - complete token failure
                logger.error(f"❌ Contacts request failed with 401 even after token refresh for user {user_id}")
                return {"error": "Token expired, please reconnect."}
            else:
                # Other API error after refresh
                logger.error(f"❌ Contacts request failed even after token refresh for user {user_id}: {retry_response.status_code}")
                return {"error": f"HubSpot API error after token refresh: {retry_response.status_code}"}
                
        else:
            # Handle other API errors
            logger.error(f"❌ HubSpot API error {response.status_code} for user {user_id}: {response.text}")
            
            if response.status_code == 403:
                # Forbidden - insufficient permissions
                return {"error": "Insufficient permissions to access contacts"}
            else:
                # Other API errors
                return {"error": f"HubSpot API error: {response.status_code}"}
                
    except httpx.RequestError as e:
        logger.error(f"❌ Network error fetching contacts for user {user_id}: {str(e)}")
        return {"error": "Network error - please try again later"}
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching contacts for user {user_id}: {str(e)}")
        return {"error": "Unexpected error occurred"}

# TODO: Implement contact fetching (keeping for reference)
async def fetch_hubspot_contacts(access_token: str):
    """
    Fetches contacts from HubSpot CRM using access token.
    
    Args:
        access_token (str): Valid HubSpot access token
        
    Returns:
        list: List of contacts formatted as IntegrationItem objects
    """
    # This functionality is now implemented in get_contacts_from_hubspot
    pass 