#!/usr/bin/env python3
"""
Permanent solution to create a clean UTF-8 .env file.
Run this script whenever you need to recreate the .env file.
"""

import os

def create_clean_env():
    """Create a clean UTF-8 .env file with proper content."""
    
    # Define the exact content we need
    env_content = """HUBSPOT_CLIENT_ID=3f168714-ef6b-444e-806d-094a11fdbd38
HUBSPOT_CLIENT_SECRET=64b1e157-9211-4c60-b907-162374fd1c09
REDIS_URL=redis://localhost:6379/0
REDIRECT_URI=http://localhost:8000/api/integrations/hubspot/callback
PORT=8000"""

    try:
        # Always write as UTF-8, never UTF-16
        with open('.env', 'w', encoding='utf-8', newline='\n') as f:
            f.write(env_content)
        
        print("✅ Created clean UTF-8 .env file")
        
        # Verify it's correct
        with open('.env', 'rb') as f:
            raw_content = f.read()
        
        print(f"📊 File size: {len(raw_content)} bytes")
        print(f"🚫 No BOM: {not raw_content.startswith(b'\\xff\\xfe')}")
        print(f"✅ UTF-8 encoded: {raw_content.startswith(b'HUBSPOT')}")
        
        # Test loading
        from dotenv import load_dotenv
        load_dotenv()
        client_id = os.getenv('HUBSPOT_CLIENT_ID')
        print(f"🔑 HUBSPOT_CLIENT_ID loads correctly: {client_id is not None}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return False

if __name__ == "__main__":
    print("🛠️ Creating clean UTF-8 .env file...")
    create_clean_env() 