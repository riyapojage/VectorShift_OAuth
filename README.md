# VectorShift OAuth Integration

A comprehensive OAuth integration system designed for VectorShift platform, enabling seamless third-party service connections with robust security and scalable architecture.

## 🎯 Project Overview

This repository contains multiple OAuth integration implementations, starting with HubSpot CRM integration. The project demonstrates production-grade authentication flows, secure token management, and modular architecture suitable for enterprise applications.

## 🏗️ Architecture

```
VectorShift_OAuth/
├── vectorshift-integration/          # 🎯 Main Implementation
│   ├── backend/                      # FastAPI Backend
│   │   ├── main.py                  # API Server
│   │   ├── integrations/            # OAuth Integrations
│   │   │   ├── hubspot.py          # HubSpot Integration
│   │   │   ├── models.py           # Data Models
│   │   │   └── utils.py            # Redis Utilities
│   │   └── .env                    # Environment Config
│   ├── frontend/                    # React Frontend
│   │   ├── src/
│   │   │   ├── components/         # UI Components
│   │   │   └── integrations/       # Integration Logic
│   │   └── .env.local             # Frontend Config
│   └── README.md                  # 📖 Detailed Setup Guide
├── src/                            # Legacy/Alternative Implementation
├── integrations/                   # Shared Integration Modules
└── ProjectBrief.md                # 📋 Project Requirements
```

## 🚀 Quick Start

### 1. Navigate to Main Implementation
```bash
cd vectorshift-integration
```

### 2. Follow Setup Guide
See the [detailed setup guide](./vectorshift-integration/README.md) for complete installation and configuration instructions.

### 3. Quick Launch
```bash
# Backend (Terminal 1)
cd vectorshift-integration/backend
pip install fastapi uvicorn redis httpx python-dotenv pydantic
uvicorn main:app --reload --port 8000

# Frontend (Terminal 2)
cd vectorshift-integration/frontend
npm install
npm start
```

## ✨ Features

### 🔐 OAuth2 Authentication
- **Secure Authorization Flow**: Complete OAuth2 implementation with PKCE
- **Token Management**: Automatic refresh token handling
- **State Protection**: CSRF protection with secure state parameters

### 🏢 HubSpot CRM Integration
- **Contact Management**: Fetch and display HubSpot contacts
- **Real-time Sync**: Live data synchronization
- **Permission Scopes**: Granular access control

### 🔄 Scalable Architecture
- **Modular Design**: Easy to add new integrations
- **Redis Caching**: High-performance token storage
- **Error Handling**: Comprehensive error management and retry logic

### 🎨 Modern UI/UX
- **React Components**: Responsive and intuitive interface
- **Loading States**: Smooth user experience with loading indicators
- **Error Recovery**: User-friendly error handling and reconnection

## 🛠️ Technology Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **Redis** - In-memory data store for token management
- **Pydantic** - Data validation and serialization
- **httpx** - Modern HTTP client for API calls

### Frontend
- **React** - Component-based UI framework
- **Axios** - HTTP client for API communication
- **React Router** - Client-side routing

### DevOps
- **Docker** - Containerization support
- **Environment Variables** - Secure configuration management
- **Git** - Version control with comprehensive .gitignore

## 📖 Documentation

- **[Setup Guide](./vectorshift-integration/README.md)** - Complete installation and configuration
- **[Project Brief](./ProjectBrief.md)** - Detailed requirements and specifications
- **API Documentation** - Available at `http://localhost:8000/docs` when running

## 🔧 Configuration

### Environment Variables
Set up the following environment variables:

**Backend (.env)**
```env
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
REDIS_URL=redis://localhost:6379
REDIRECT_URI=http://localhost:3000/hubspot/callback
```

**Frontend (.env.local)**
```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

## 🧪 Testing

### Health Check
```bash
# API Health
curl http://localhost:8000/health

# Redis Connection  
redis-cli ping
```

### OAuth Flow Testing
1. Start both backend and frontend servers
2. Navigate to `http://localhost:3000`
3. Click "Connect HubSpot"
4. Complete OAuth flow
5. Verify token storage in Redis

## 📊 Project Status

- ✅ **OAuth2 Flow** - Complete implementation
- ✅ **HubSpot Integration** - Full CRM access
- ✅ **Token Management** - Secure storage and refresh
- ✅ **Frontend UI** - Modern React interface
- ✅ **Redis Integration** - High-performance caching
- ✅ **Error Handling** - Comprehensive error management
- 🔄 **Additional Integrations** - Ready for expansion

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-integration`)
3. Commit your changes (`git commit -am 'Add new integration'`)
4. Push to the branch (`git push origin feature/new-integration`)
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For detailed setup instructions and troubleshooting, see the [main implementation guide](./vectorshift-integration/README.md).

### Common Issues
- **Redis Connection**: See Windows installation guide in the main README
- **OAuth Callback**: Ensure redirect URI matches HubSpot app settings
- **CORS Issues**: Check API base URL configuration

---

**Built with ❤️ for VectorShift Platform**

*A robust, scalable, and secure OAuth integration system designed for enterprise applications.* 