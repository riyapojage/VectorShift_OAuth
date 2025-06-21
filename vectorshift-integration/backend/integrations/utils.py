import redis
import os
from dotenv import load_dotenv
from typing import Dict, Optional, Any, Union
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Redis client configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Initialize Redis client at module scope for reuse
redis_client: Optional[redis.Redis] = None

# In-memory fallback storage for development/testing
in_memory_store: Dict[str, Dict[str, str]] = {}

try:
    # Create synchronous Redis client with string decoding
    redis_client = redis.Redis.from_url(
        REDIS_URL, 
        decode_responses=True,
        socket_timeout=5,
        socket_connect_timeout=5
    )
    # Test connection
    redis_client.ping()
    logger.info(f"✅ Connected to Redis at {REDIS_URL}")
except redis.ConnectionError as e:
    logger.warning(f"⚠️ Redis not available: {e}")
    logger.info("🔄 Falling back to in-memory storage for development")
    redis_client = None
except Exception as e:
    logger.warning(f"⚠️ Redis connection issue: {e}")
    logger.info("🔄 Falling back to in-memory storage for development")
    redis_client = None

def save_credentials(user_id: str, tokens: Dict[str, Any]) -> None:
    """
    Save HubSpot credentials/tokens to Redis or in-memory storage.
    
    Args:
        user_id (str): Unique user identifier
        tokens (dict): Dictionary containing access_token, refresh_token, etc.
    
    Storage key format: 'hubspot:{user_id}'
    
    Raises:
        Exception: If both Redis and in-memory storage fail
    """
    # Convert all values to strings for consistent storage
    string_tokens = {k: str(v) for k, v in tokens.items()}
    
    if redis_client:
        try:
            # Create Redis key for this user
            redis_key = f"hubspot:{user_id}"
            
            # Save credentials as hash map using HSET
            redis_client.hset(redis_key, mapping=string_tokens)
            
            # Set expiration - 30 days for security
            redis_client.expire(redis_key, 30 * 24 * 60 * 60)
            
            logger.info(f"💾 Saved credentials to Redis for user: {user_id}")
            logger.info(f"🔑 Stored keys: {list(tokens.keys())}")
            return
            
        except redis.RedisError as e:
            logger.error(f"❌ Redis error saving credentials for {user_id}: {e}")
            logger.info("🔄 Falling back to in-memory storage")
        except Exception as e:
            logger.error(f"❌ Unexpected Redis error saving credentials for {user_id}: {e}")
            logger.info("🔄 Falling back to in-memory storage")
    
    # Fallback to in-memory storage
    try:
        storage_key = f"hubspot:{user_id}"
        in_memory_store[storage_key] = string_tokens
        
        logger.info(f"💾 Saved credentials to memory for user: {user_id}")
        logger.info(f"🔑 Stored keys: {list(tokens.keys())}")
        
    except Exception as e:
        logger.error(f"❌ Failed to save credentials to memory for {user_id}: {e}")
        raise Exception(f"Failed to save credentials: {e}")

def load_credentials(user_id: str) -> Optional[Dict[str, str]]:
    """
    Load HubSpot credentials/tokens from Redis or in-memory storage.
    
    Args:
        user_id (str): Unique user identifier
        
    Returns:
        dict: Token dictionary if found, None if not found
        
    Storage key format: 'hubspot:{user_id}'
    """
    storage_key = f"hubspot:{user_id}"
    
    # Try Redis first if available
    if redis_client:
        try:
            # Load all fields from hash using individual HGET calls to avoid type issues
            # First check if the key exists
            if not redis_client.exists(storage_key):
                logger.info(f"🔍 No Redis credentials found for user: {user_id}")
            else:
                # Try to get specific known fields to avoid type issues
                # These are the expected credential fields
                expected_fields = ['access_token', 'refresh_token', 'expires_in', 'token_type', 'scope']
                
                # Process credentials ensuring string types
                processed_credentials: Dict[str, str] = {}
                found_any = False
                
                for field_name in expected_fields:
                    field_value = redis_client.hget(storage_key, field_name)
                    if field_value is not None:
                        processed_credentials[field_name] = str(field_value)
                        found_any = True
                
                # If no expected fields found, try to get all fields using a different approach
                if not found_any:
                    try:
                        # Use HGETALL as a fallback, with explicit type handling
                        all_fields = redis_client.hgetall(storage_key)
                        if all_fields and isinstance(all_fields, dict):
                            for key, value in all_fields.items():
                                processed_credentials[str(key)] = str(value)
                                found_any = True
                    except Exception as e:
                        logger.warning(f"Could not retrieve all fields: {e}")
                
                if found_any:
                    logger.info(f"🔓 Loaded credentials from Redis for user: {user_id}")
                    logger.info(f"🔑 Available keys: {list(processed_credentials.keys())}")
                    return processed_credentials
                
        except redis.RedisError as e:
            logger.error(f"❌ Redis error loading credentials for {user_id}: {e}")
        except Exception as e:
            logger.error(f"❌ Unexpected Redis error loading credentials for {user_id}: {e}")
    
    # Fallback to in-memory storage
    if storage_key in in_memory_store:
        credentials = in_memory_store[storage_key]
        logger.info(f"🔓 Loaded credentials from memory for user: {user_id}")
        logger.info(f"🔑 Available keys: {list(credentials.keys())}")
        return credentials
    
    logger.info(f"🔍 No credentials found for user: {user_id}")
    return None

def delete_credentials(user_id: str) -> bool:
    """
    Delete HubSpot credentials/tokens from Redis.
    
    Args:
        user_id (str): Unique user identifier
        
    Returns:
        bool: True if deleted, False if key didn't exist
    """
    if not redis_client:
        logger.error("❌ Redis client not available")
        return False
    
    try:
        # Create Redis key for this user
        redis_key = f"hubspot:{user_id}"
        
        # Check if key exists first
        if not redis_client.exists(redis_key):
            logger.info(f"🔍 No credentials found to delete for user: {user_id}")
            return False
        
        # Delete the key
        redis_client.delete(redis_key)
        
        # Verify deletion
        if not redis_client.exists(redis_key):
            logger.info(f"🗑️ Deleted credentials for user: {user_id}")
            return True
        else:
            logger.error(f"❌ Failed to delete credentials for user: {user_id}")
            return False
            
    except redis.RedisError as e:
        logger.error(f"❌ Redis error deleting credentials for {user_id}: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error deleting credentials for {user_id}: {e}")
        return False

def check_redis_connection() -> bool:
    """
    Check if Redis connection is healthy.
    
    Returns:
        bool: True if Redis is connected and responsive
    """
    if not redis_client:
        return False
    
    try:
        redis_client.ping()
        return True
    except Exception:
        return False 