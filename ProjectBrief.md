Here is your **final, updated, and detailed Project Brief** to give to **Cursor**.

This version includes:

* A clear explanation of **what we are building**
* The **required functionality** based on the official assessment
* The **tech stack**
* All **optimal enhancements** we want to add for production-readiness
* Written in a **clean and structured format** that Cursor can understand before generating any code

---

## 🔧 Project Brief for Cursor

**HubSpot Integration for VectorShift (Build from Scratch)**

> *Prepared for AI Developer Assistant (Cursor)*

---

### 🧩 Project Goal

We are building a **modular HubSpot integration** from scratch for a platform called **VectorShift**.
The integration should allow users to:

* Connect their **HubSpot CRM account** using **OAuth2**
* Securely store their **access and refresh tokens**
* Fetch user-specific **HubSpot data** (e.g., contacts)
* Return and display this data in the frontend

We are not editing or extending any codebase — this is a **new, self-contained project**, and we need to implement everything from scratch while keeping it **clean, modular, and production-ready**.

---

### ✅ Functional Requirements

#### 1. **OAuth2 Login Flow (HubSpot)**

* Redirect users to HubSpot login via a backend `/authorize` route.
* Handle HubSpot’s callback with `?code=...` via a `/callback` backend route.
* Exchange `code` for `access_token` and `refresh_token`.
* Store these tokens securely in Redis, tied to a user ID.

#### 2. **Token Management**

* Read/write tokens from Redis with keys like `hubspot:{user_id}`.
* Support **refresh token flow**: if `access_token` is expired, use `refresh_token` to obtain a new one.

#### 3. **Fetch User's HubSpot Contacts**

* Use stored token to call HubSpot's API:
  `GET /crm/v3/objects/contacts?properties=firstname,lastname,email`
* Transform result into a unified `IntegrationItem` object:

  ```python
  {
    id: str,
    title: str,
    properties: dict
  }
  ```

#### 4. **Frontend Integration**

* “Connect HubSpot” button initiates auth flow.
* Show success/failure after callback.
* Fetch and display contact data (Name + Email) in the UI.
* Include loading, error, and “reconnect” state handling.

---

### ⚙️ Tech Stack

#### Backend

* Python 3.10+
* FastAPI
* Redis
* httpx or requests
* python-dotenv
* pydantic

#### Frontend

* React (Create React App)
* axios
* react-router-dom
* dotenv

---

### 📦 Backend Package Install

```bash
pip install fastapi uvicorn redis httpx python-dotenv pydantic
```

---

### 📦 Frontend Package Install

```bash
npm install axios react-router-dom dotenv
```

---

### 🧠 Enhancements We Want for an Optimal Build

To make this integration **robust, scalable, and production-grade**, we are including the following advanced features:

---

#### ✅ 1. Refresh Token Handling (Backend)

* Detect when access token is expired (HTTP 401 or 403)
* Automatically request a new access token using refresh token
* Retry the original HubSpot API request after refreshing

---

#### ✅ 2. Basic User Context

* Mock a `user_id` in headers or query params (e.g., `?user_id=test_user`)
* Use this to key credentials in Redis
* This will later allow multi-user support

---

#### ✅ 3. Error Handling

* Graceful 401 (unauthorized) errors with “Reconnect” prompt in frontend
* Handle 429 (rate limit) with a retry after `Retry-After` header
* Fallback message: “Could not load data — try again later”

---

#### ✅ 4. Loading & UI State Management (Frontend)

* Show “Connecting…” while redirecting to HubSpot
* Show “Loading data…” while fetching contacts
* Show success (“HubSpot connected”) or failure states clearly

---

#### ✅ 5. Pagination Support (Optional)

* HubSpot API returns paginated data
* Use `after` cursor param to fetch more results if needed (not required for MVP but structure code to allow this later)

---

#### ✅ 6. Environment Config

* Never hardcode secrets or tokens
* Use `.env` in backend and `.env.local` in frontend
* Variables needed:

  * `HUBSPOT_CLIENT_ID`
  * `HUBSPOT_CLIENT_SECRET`
  * `REDIS_URL`
  * `REACT_APP_API_BASE_URL`

---

### 📁 Folder Structure

```
vectorshift-integration/
├── backend/
│   ├── main.py
│   ├── .env
│   └── integrations/
│       ├── hubspot.py
│       ├── models.py
│       └── utils.py
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── integrations/
│   │   │   └── HubspotIntegration.js
│   │   └── components/
│   │       └── IntegrationSelector.js
│   └── .env.local
```

---

### 🚀 Final Deliverables

* Working OAuth flow (backend + frontend)
* Secure Redis token storage
* Backend route: `/api/integrations/hubspot/items`
* Frontend UI:

  * Connect button
  * Success/error states
  * Display contact list (name, email)
* README with setup & test instructions

---

### 🎯 Summary

This project is a clean, scalable, production-level integration with HubSpot, built from scratch. It includes all required parts from the VectorShift technical assessment — plus extra enhancements to make it future-ready and developer-friendly.

Cursor, your job is to **implement this one file/module at a time** based on structured prompts that will follow this context.

---
