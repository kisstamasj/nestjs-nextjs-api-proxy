# NestJS + Next.js API Proxy Starter

A robust starter template demonstrating secure, production-ready communication between a **NestJS backend** and a **Next.js frontend** using a **Universal API Proxy**.

This project implements a secure authentication flow where **JWT tokens are never exposed to the client**. Instead, they are managed server-side by the Next.js API Proxy and stored in encrypted, HTTP-only cookies.

## 🚀 Key Features

### 🛡️ Universal API Proxy
- **Single Route Handler**: A catch-all route (`/api/(api-proxy)/[...path]`) handles ALL requests to the backend.
- **Transparent Authentication**: Automatically injects the Access Token into requests.
- **Smart Token Refreshing**: Intercepts 401 responses, refreshes the Access Token using the Refresh Token, and **retries the original request** seamlessly.
- **Zero-Config Proxying**: Forwards method, headers, queries, and bodies automatically.

### 🔒 Maximum Security
- **No Client-Side Tokens**: Access and Refresh tokens are stored in **encrypted, HTTP-only, Secure, SameSite cookies**.
- **Session Encryption**: Session data is encrypted using `jose` (JWE) before being stored in cookies.
- **CSRF Protection**: Cookie-based session management prevents XSS attacks from stealing tokens.

### ⚡ Advanced Capabilities
- **Streaming Support**: Full support for streaming file uploads and downloads (binary data).
- **Type Safety**: End-to-end TypeScript integration.
- **Standardized Error Handling**: Consistent error responses for proxy failures.

## 🏗️ Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Radix UI
- **Backend**: NestJS 11, Express, Passport.js
- **Database**: PostgreSQL, Drizzle ORM
- **Auth**: JWT (Access + Refresh), Argon2 hashing

## 📐 Architecture

The core of this project is the **API Proxy** located at `frontend/app/api/(api-proxy)/[...path]/route.ts`.

```mermaid
sequenceDiagram
    participant Client
    participant Proxy as Next.js API Proxy
    participant Backend as NestJS API

    Client->>Proxy: Request (e.g., GET /users)
    Note over Client,Proxy: Cookie: session_token (Encrypted)
    
    Proxy->>Proxy: Decrypt Session & Extract Access Token
    
    Proxy->>Backend: Forward Request + Authorization: Bearer <token>
    
    alt Access Token Valid
        Backend-->>Proxy: 200 OK + Data
        Proxy-->>Client: 200 OK + Data
    else Access Token Expired (401)
        Backend-->>Proxy: 401 Unauthorized
        Proxy->>Backend: POST /auth/refresh (Refresh Token)
        
        alt Refresh Successful
            Backend-->>Proxy: 200 OK + New Tokens
            Proxy->>Proxy: Update Session Cookie
            Proxy->>Backend: Retry Original Request (New Token)
            Backend-->>Proxy: 200 OK + Data
            Proxy-->>Client: 200 OK + Data + Set-Cookie (Updated)
        else Refresh Failed
            Backend-->>Proxy: 401 Unauthorized
            Proxy-->>Client: 401 Unauthorized (Redirect to Login)
        end
    end
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- pnpm
- Docker & Docker Compose

### 1. Start Database
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
pnpm install
# Create .env (see .env.example or below)
pnpm drizzle:migrate # Setup DB schema
pnpm start:dev
```

### 3. Frontend Setup
```bash
cd frontend
pnpm install
# Create .env.local (see .env.example or below)
pnpm dev
```

### Environment Variables

**Backend (`backend/.env`)**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/health_app_db
JWT_ACCESS_TOKEN_SECRET=min-32-chars-secret
JWT_REFRESH_TOKEN_SECRET=min-32-chars-secret
JWT_ACCESS_TOKEN_EXPIRATION_TIME=900
JWT_REFRESH_TOKEN_EXPIRATION_TIME=604800
FRONTEND_URL=http://localhost:3000
```

**Frontend (`frontend/.env.local`)**
```env
BACKEND_API_URL=http://localhost:5000
SESSION_SECRET=min-32-chars-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📁 Project Structure

Key files for the API Proxy implementation:

```
├── frontend/
│   ├── app/
│   │   └── api/
│   │       └── (api-proxy)/
│   │           └── [...path]/
│   │               └── route.ts    # 🌟 THE UNIVERSAL PROXY
│   ├── lib/
│   │   ├── proxy-utils.ts          # Helpers for headers, retry logic
│   │   └── session.ts              # Session encryption/decryption
└── backend/
    └── src/
        └── auth/                   # Standard JWT Auth implementation
```

## 📚 Documentation

- [**API Proxy Guide**](./API_PROXY_GUIDE.md): Deep dive into the proxy implementation details.
- [**File Upload/Download**](./FILE_UPLOAD_DOWNLOAD_GUIDE.md): How to handle streaming files through the proxy.

## 🤝 Contributing

Feel free to use this as a starter for your own projects!
