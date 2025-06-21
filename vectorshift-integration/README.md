# VectorShift HubSpot Integration

A production-grade HubSpot CRM integration built with FastAPI (backend) + React (frontend), featuring OAuth2 authentication and secure token storage.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 16+
- Redis (see Windows installation below)

### Backend Setup
```bash
cd vectorshift-integration/backend
pip install fastapi uvicorn redis httpx python-dotenv pydantic
uvicorn main:app --reload --port 8000
```

### Frontend Setup  
```bash
cd vectorshift-integration/frontend
npm install
npm start
```

### Environment Variables
Create `.env` in backend directory:
```env
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
REDIS_URL=redis://localhost:6379
REDIRECT_URI=http://localhost:3000/hubspot/callback
```

Create `.env.local` in frontend directory:
```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

## 🖥️ Windows Redis Installation

### Option 1: Microsoft Store (Recommended)
1. Open Microsoft Store
2. Search for "Redis"
3. Install Redis by Microsoft
4. Redis will auto-start as Windows service

### Option 2: Chocolatey
```powershell
# Install Chocolatey first if not installed
Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Install Redis
choco install redis-64

# Start Redis service
redis-server
```

### Option 3: WSL2 (Linux Subsystem)
```powershell
# Install WSL2
wsl --install

# In WSL terminal:
sudo apt update
sudo apt install redis-server
redis-server
```

### Option 4: Docker
```powershell
# Run Redis in Docker container
docker run -d -p 6379:6379 --name redis redis:alpine

# Verify Redis is running
docker ps
```

### Verify Redis Installation
Test Redis connection:
```bash
# Command line test
redis-cli ping
# Should return: PONG

# Test via API health check
curl http://localhost:8000/health
```

## 🔧 Troubleshooting

### Redis Connection Issues
1. **"redis-server.exe not recognized"**
   - Redis not installed or not in PATH
   - Try installation options above

2. **"Connection refused"**
   - Redis service not running
   - Start: `redis-server` or check Windows Services

3. **"Permission denied"**
   - Run PowerShell as Administrator
   - Or use WSL2 option

### OAuth Issues
1. **"Connect HubSpot" immediately shows "Connected"**
   - Fixed in latest version
   - Button now properly redirects to HubSpot

2. **Authorization callback fails**
   - Check REDIRECT_URI in .env matches HubSpot app settings
   - Ensure frontend is running on http://localhost:3000

### Backend Issues
1. **"Module not found" errors**
   - Install dependencies: `pip install -r requirements.txt`
   - Check Python path in main.py

## 🏗️ Architecture

### OAuth Flow
1. User clicks "Connect HubSpot" → Frontend calls `/api/integrations/hubspot/authorize`
2. Backend redirects user to HubSpot authorization page
3. User grants permissions on HubSpot
4. HubSpot redirects to `http://localhost:3000/hubspot/callback?code=...`
5. Frontend callback component calls `/api/integrations/hubspot/callback`
6. Backend exchanges code for tokens and stores in Redis
7. User redirected back to main app with success indicator

### File Structure
```
vectorshift-integration/
├── backend/
│   ├── main.py                 # FastAPI app + routes
│   │   ├── integrations/
│   │   │   ├── hubspot.py         # HubSpot OAuth + API logic
│   │   │   └── utils.py           # Redis storage utilities
│   │   └── .env                   # Environment variables
│   └── frontend/
│       ├── src/
│       │   ├── App.js             # React router setup
│       │   ├── components/
│       │   │   ├── IntegrationSelector.js  # Main integration UI
│       │   │   └── HubspotCallback.js      # OAuth callback handler
│       │   └── integrations/
│       │       └── HubspotIntegration.js   # HubSpot API functions
│       └── .env.local             # Frontend environment variables
└── README.md                  # This file
```

## 🧪 Testing

### Manual Testing Steps
1. Start backend: `uvicorn main:app --reload --port 8000`
2. Start frontend: `npm start`
3. Visit http://localhost:3000
4. Click "Connect HubSpot" → Should redirect to HubSpot
5. Grant permissions → Should redirect back with success
6. Check Redis storage: `redis-cli HGETALL hubspot:test_user`

### API Health Check
```bash
# Test API is running
curl http://localhost:8000/ping
# Response: {"message": "pong"}

# Test Redis connection + get Windows guidance
curl http://localhost:8000/health
# Response includes Redis status and Windows installation tips
```

## 🔐 Security Notes

- Tokens stored in Redis with 30-day expiration
- OAuth state parameter prevents CSRF attacks
- Environment variables keep secrets out of code
- CORS enabled for development (restrict in production)

## 📝 Next Steps

- [ ] Implement token refresh logic
- [ ] Add HubSpot contacts fetching endpoint
- [ ] Add rate limiting and retry logic
- [ ] Deploy to production environment 