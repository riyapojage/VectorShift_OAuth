#!/usr/bin/env python3
"""
Script to add FRONTEND_URL to existing .env file
"""

import os

def update_env_file():
    """Add FRONTEND_URL to existing .env file if not already present."""
    
    env_file = '.env'
    frontend_url_line = 'FRONTEND_URL=http://localhost:3000'
    
    try:
        # Read current content
        if os.path.exists(env_file):
            with open(env_file, 'r', encoding='utf-8') as f:
                content = f.read()
        else:
            content = ""
        
        # Check if FRONTEND_URL already exists
        if 'FRONTEND_URL=' in content:
            print("✅ FRONTEND_URL already exists in .env file")
            return True
        
        # Add FRONTEND_URL to the end
        if content and not content.endswith('\n'):
            content += '\n'
        content += frontend_url_line + '\n'
        
        # Write updated content
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Added FRONTEND_URL to .env file")
        print(f"📝 Added: {frontend_url_line}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating .env file: {e}")
        return False

if __name__ == "__main__":
    print("🛠️ Updating .env file with FRONTEND_URL...")
    update_env_file() 