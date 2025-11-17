# API Proxy Security & Robustness Analysis

## Executive Summary

The current API proxy implementation is **functionally solid** for basic authentication flows but has **several gaps** in handling edge cases, security scenarios, and production-ready error handling. This document outlines all potential scenarios a web app can face and identifies what's missing.

---

## ✅ What's Currently Handled Well

1. **Basic Authentication Flow** - Sign-in, sign-out
2. **Automatic Token Refresh** - Handles 401 with refresh token retry
3. **Session Encryption** - JWT with HS256
4. **HTTP-only Cookies** - Prevents XSS attacks
5. **Multiple HTTP Methods** - GET, POST, PUT, DELETE, PATCH, OPTIONS
6. **Request Body Caching** - For retry scenarios
7. **Header Forwarding** - User-agent, x-forwarded-for

---

## ❌ Critical Missing Scenarios

### 1. **Environment Configuration Issues**

**Current Problem:**
```typescript
export const BACKEND_API_URL = process.env.BACKEND_API_URL;
export const SESSION_SECRET = process.env.SESSION_SECRET;
```

**Missing Validation:**
- No check if `BACKEND_API_URL` is undefined
- No check if `SESSION_SECRET` is undefined or too short
- No validation of URL format

**What Could Happen:**
- Runtime errors with `undefined` URLs
- Weak encryption if SESSION_SECRET is short
- App crashes on first request

**Fix Needed:**
```typescript
if (!process.env.BACKEND_API_URL) {
  throw new Error("BACKEND_API_URL environment variable is required");
}
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters");
}
```

---

### 2. **Network Timeouts & Backend Unavailability**

**Current Problem:**
```typescript
return fetch(backendUrl, options);
```

**Missing:**
- No timeout configuration
- No retry logic for network failures
- No circuit breaker pattern
- No graceful degradation

**What Could Happen:**
- Requests hang indefinitely if backend is slow
- Frontend becomes unresponsive
- No user feedback on backend downtime

**Fix Needed:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

try {
  const response = await fetch(backendUrl, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  return response;
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    return new Response(JSON.stringify({ error: 'Request timeout' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  throw error;
}
```

---

### 3. **Malformed Backend Responses**

**Current Problem:**
```typescript
const data = await response.json(); // In handleSignIn
```

**Missing:**
- No validation that response is valid JSON
- No schema validation for expected fields
- Assumes backend always returns correct structure

**What Could Happen:**
- JSON parse errors crash the proxy
- Missing fields cause undefined errors
- User sees 500 errors instead of proper error messages

**Fix Needed:**
```typescript
async function handleSignIn(response: Response): Promise<NextResponse> {
  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error("Invalid JSON response from sign-in endpoint", error);
    return NextResponse.json(
      { error: "Invalid response from authentication server" },
      { status: 502 }
    );
  }

  // Validate required fields
  if (!data.accessToken || !data.refreshToken || !data.id || !data.email) {
    console.error("Missing required fields in sign-in response", data);
    return NextResponse.json(
      { error: "Invalid authentication response" },
      { status: 502 }
    );
  }
  
  // ... rest of logic
}
```

---

### 4. **Content-Type Handling**

**Current Problem:**
```typescript
const data = await response.text(); // Always treats as text
```

**Missing:**
- No content-type detection
- Assumes all responses are text/JSON
- Binary responses (files, images) not handled properly

**What Could Happen:**
- File downloads corrupted
- Image uploads/downloads fail
- Large responses consume memory

**Fix Needed:**
```typescript
async function handleResponse(response: Response): Promise<NextResponse> {
  const contentType = response.headers.get('content-type');
  
  // Handle binary/streaming responses
  if (contentType?.includes('application/octet-stream') ||
      contentType?.includes('image/') ||
      contentType?.includes('video/')) {
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  }
  
  // Handle text/JSON responses
  const data = await response.text();
  return createNextResponse(response, data);
}
```

---

### 5. **Large Request Body Handling**

**Current Problem:**
```typescript
const cachedBody = request.method !== "GET" && request.method !== "HEAD" 
  ? await request.text() 
  : undefined;
```

**Missing:**
- No size limit on request body
- Entire body loaded into memory
- File uploads could crash the server

**What Could Happen:**
- Memory exhaustion with large file uploads
- DoS attack by sending huge payloads
- Server crashes

**Fix Needed:**
```typescript
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

const contentLength = request.headers.get('content-length');
if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
  return NextResponse.json(
    { error: 'Request body too large' },
    { status: 413 }
  );
}

// For file uploads, stream directly without caching
const isFileUpload = request.headers.get('content-type')?.includes('multipart/form-data');
if (isFileUpload) {
  // Don't cache, stream directly
  return forwardRequestStreaming(request, fullPath, accessToken);
}
```

---

### 6. **Concurrent Refresh Token Requests (Race Condition)**

**Current Problem:**
- Multiple requests with expired tokens trigger simultaneous refresh calls
- Each creates a new token, invalidating previous ones
- Results in refresh loop or logout

**Missing:**
- No in-flight request deduplication
- No refresh token lock

**What Could Happen:**
```
Request 1: 401 → Refresh (gets token A)
Request 2: 401 → Refresh (gets token B, invalidates A)
Request 1: Retry with token A → 401 (token invalidated)
Request 1: Refresh (gets token C, invalidates B)
... infinite loop
```

**Fix Needed:**
```typescript
// Global refresh promise cache
let refreshPromise: Promise<RefreshResponse | null> | null = null;

async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshResponse | null> {
  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    console.log("Refresh already in progress, waiting...");
    return refreshPromise;
  }

  // Start new refresh
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}${REFRESH_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Token refresh failed:", error);
      return null;
    } finally {
      // Clear the promise after completion
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
```

---

### 7. **CORS Preflight (OPTIONS) Handling**

**Current Problem:**
```typescript
export const OPTIONS = createHandler;
```

**Missing:**
- OPTIONS requests forwarded to backend
- No CORS headers added
- Preflight requests may fail

**What Could Happen:**
- CORS errors in browser
- Cross-origin requests blocked
- Frontend can't make authenticated requests

**Fix Needed:**
```typescript
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
```

---

### 8. **Rate Limiting & DDoS Protection**

**Current Problem:**
- No rate limiting at proxy level
- No IP-based throttling
- No request validation

**Missing:**
- Protection against brute force attacks
- Per-IP rate limits
- Per-user rate limits

**What Could Happen:**
- DDoS attacks overwhelm backend
- Brute force attacks on sign-in
- Resource exhaustion

**Fix Needed:**
```typescript
import { RateLimiter } from 'limiter';

const rateLimiters = new Map<string, RateLimiter>();

function getRateLimiter(ip: string): RateLimiter {
  if (!rateLimiters.has(ip)) {
    // 100 requests per minute
    rateLimiters.set(ip, new RateLimiter({ tokensPerInterval: 100, interval: 'minute' }));
  }
  return rateLimiters.get(ip)!;
}

// In handleRequest
const ip = request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown';

const limiter = getRateLimiter(ip);
if (!await limiter.tryRemoveTokens(1)) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429, headers: { 'Retry-After': '60' } }
  );
}
```

---

### 9. **Session JWT Expiration Handling**

**Current Problem:**
```typescript
export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (error) {
    console.log("Failed to verify session", error);
  }
}
```

**Missing:**
- Silent failure on expired JWT
- No distinction between expired vs invalid
- User not logged out when session expires

**What Could Happen:**
- User appears logged in but requests fail
- Confusing UX (session appears valid in code, but is expired)
- No automatic redirect to login

**Fix Needed:**
```typescript
export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return { payload: payload as SessionPayload, expired: false };
  } catch (error) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      console.log("Session JWT expired");
      return { payload: null, expired: true };
    }
    console.log("Failed to verify session", error);
    return { payload: null, expired: false };
  }
}

// In handleRequest, clear cookie if expired
const decryptResult = sessionToken ? await decrypt(sessionToken) : null;
if (decryptResult?.expired) {
  const response = NextResponse.json({ error: 'Session expired' }, { status: 401 });
  response.cookies.delete(SESSION_TOKEN_COOKIE);
  return response;
}
```

---

### 10. **Error Response Handling**

**Current Problem:**
```typescript
// No centralized error handling
// Each error scenario handled ad-hoc
```

**Missing:**
- Consistent error response format
- Error logging/monitoring
- User-friendly error messages
- Error codes for frontend

**What Could Happen:**
- Inconsistent error responses
- Hard to debug production issues
- Poor user experience

**Fix Needed:**
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  statusCode: number;
}

function createErrorResponse(
  code: string,
  message: string,
  statusCode: number
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    error: code,
    message,
    code,
    statusCode,
  };
  
  // Log to monitoring service (Sentry, DataDog, etc.)
  if (process.env.NODE_ENV === 'production') {
    console.error('[API Proxy Error]', response);
    // Sentry.captureException(new Error(message), { extra: response });
  }
  
  return NextResponse.json(response, { status: statusCode });
}

// Usage
return createErrorResponse(
  'TOKEN_REFRESH_FAILED',
  'Failed to refresh authentication token',
  401
);
```

---

### 11. **Backend 5xx Error Handling**

**Current Problem:**
```typescript
// All responses forwarded as-is, even 500 errors
const data = await response.text();
return createNextResponse(response, data);
```

**Missing:**
- No retry logic for transient errors
- No fallback responses
- Backend stack traces exposed to client

**What Could Happen:**
- Temporary backend issues cause permanent failures
- Sensitive error details leaked
- Poor user experience

**Fix Needed:**
```typescript
async function forwardRequestWithRetry(
  request: NextRequest,
  path: string,
  accessToken?: string,
  cachedBody?: string,
  retries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await forwardRequest(request, path, accessToken, cachedBody);
      
      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      
      // Don't retry successful responses
      if (response.ok) {
        return response;
      }
      
      // Retry server errors (5xx)
      if (response.status >= 500 && attempt < retries) {
        console.log(`Backend error ${response.status}, retrying (${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        console.log(`Request failed, retrying (${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }
  
  // All retries failed
  throw lastError || new Error('Request failed after retries');
}
```

---

### 12. **Request/Response Size Limits**

**Current Problem:**
```typescript
const data = await response.text(); // No size limit
```

**Missing:**
- No response size validation
- Memory could be exhausted

**What Could Happen:**
- Backend returns huge response
- Memory exhaustion
- Server crashes

**Fix Needed:**
```typescript
const MAX_RESPONSE_SIZE = 50 * 1024 * 1024; // 50MB

async function readResponseSafely(response: Response): Promise<string> {
  const contentLength = response.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
    throw new Error('Response too large');
  }
  
  const reader = response.body?.getReader();
  if (!reader) {
    return '';
  }
  
  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    totalSize += value.length;
    if (totalSize > MAX_RESPONSE_SIZE) {
      reader.cancel();
      throw new Error('Response too large');
    }
    
    chunks.push(value);
  }
  
  const blob = new Blob(chunks);
  return await blob.text();
}
```

---

### 13. **Refresh Token Rotation & Invalidation**

**Current Problem:**
```typescript
// No handling of refresh token invalidation scenarios
```

**Missing:**
- No detection of token reuse attacks
- No handling of revoked refresh tokens
- No cleanup of old sessions

**What Could Happen:**
- Compromised refresh tokens used indefinitely
- Security breach not detected
- Session hijacking

**Fix Needed:**
```typescript
async function handleTokenRefresh(
  request: NextRequest,
  fullPath: string,
  sessionPayload: SessionPayload,
  refreshToken: string,
  cachedBody?: string
): Promise<NextResponse | null> {
  const refreshResult = await refreshAccessToken(refreshToken);

  if (!refreshResult) {
    // Check if it's a token reuse attack (refresh token already used)
    const errorResponse = NextResponse.json(
      { 
        error: "REFRESH_FAILED",
        message: "Session expired. Please sign in again.",
        code: "TOKEN_REFRESH_FAILED"
      },
      { status: 401 }
    );
    
    // Clear all sessions for this user (security measure)
    errorResponse.cookies.delete(SESSION_TOKEN_COOKIE);
    
    // Log potential security incident
    console.error('Refresh token failed for user:', sessionPayload.id, {
      email: sessionPayload.email,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for'),
    });
    
    return errorResponse;
  }
  
  // ... rest of logic
}
```

---

### 14. **Sign-Out with Token Revocation**

**Current Problem:**
```typescript
async function handleSignOut(response: Response): Promise<NextResponse> {
  const data = await response.text();
  const nextResponse = createNextResponse(response, data);
  nextResponse.cookies.delete(SESSION_TOKEN_COOKIE);
  return nextResponse;
}
```

**Missing:**
- No handling of backend sign-out failures
- Cookie deleted even if backend revocation fails
- Partial logout state

**What Could Happen:**
- User appears logged out locally but session active on backend
- Security vulnerability
- Inconsistent state

**Fix Needed:**
```typescript
async function handleSignOut(response: Response): Promise<NextResponse> {
  const data = await response.text();
  const nextResponse = createNextResponse(response, data);
  
  // Only delete cookie if backend successfully revoked the session
  if (response.ok) {
    nextResponse.cookies.delete(SESSION_TOKEN_COOKIE);
  } else {
    // Backend sign-out failed, log but still delete cookie for safety
    console.error('Backend sign-out failed, clearing local session anyway');
    nextResponse.cookies.delete(SESSION_TOKEN_COOKIE);
  }
  
  return nextResponse;
}
```

---

### 15. **Query Parameter Handling**

**Current Problem:**
```typescript
const backendUrl = `${BACKEND_API_URL}${path}${url.search}`;
```

**Missing:**
- No validation of query parameters
- No sanitization
- Potential injection attacks

**What Could Happen:**
- Query parameter injection
- Malicious URLs constructed
- Backend receives unsafe input

**Fix Needed:**
```typescript
function sanitizeQueryParams(searchParams: URLSearchParams): string {
  const sanitized = new URLSearchParams();
  
  for (const [key, value] of searchParams.entries()) {
    // Remove potentially dangerous characters
    const cleanKey = key.replace(/[^\w\-_.]/g, '');
    const cleanValue = value.replace(/[<>'"]/g, '');
    
    if (cleanKey && cleanValue) {
      sanitized.append(cleanKey, cleanValue);
    }
  }
  
  const result = sanitized.toString();
  return result ? `?${result}` : '';
}

// Usage
const url = new URL(request.url);
const queryString = sanitizeQueryParams(url.searchParams);
const backendUrl = `${BACKEND_API_URL}${path}${queryString}`;
```

---

### 16. **Health Check & Monitoring Endpoints**

**Current Problem:**
- No health check endpoint
- No monitoring/metrics
- Can't verify proxy is working

**Missing:**
- Health check for backend connectivity
- Metrics for request count, latency
- Debugging endpoints

**What Could Happen:**
- Can't monitor system health
- Issues discovered too late
- Difficult to debug production problems

**Fix Needed:**
```typescript
// In handleRequest, add special endpoints
if (fullPath === '/_health') {
  try {
    // Check backend connectivity
    const healthCheck = await fetch(`${BACKEND_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    return NextResponse.json({
      status: 'ok',
      backend: healthCheck.ok ? 'connected' : 'degraded',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      backend: 'unreachable',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
```

---

### 17. **Cookie Domain & Path Configuration**

**Current Problem:**
```typescript
// Cookie options hardcoded
path: "/",
```

**Missing:**
- No domain configuration for subdomain support
- No environment-specific cookie settings
- Hardcoded paths

**What Could Happen:**
- Cookies don't work across subdomains
- Development vs production cookie conflicts
- Mobile app integration issues

**Fix Needed:**
```typescript
export const getSessionTokenOption = (sessionPayload: string) => {
  return {
    name: SESSION_TOKEN_COOKIE,
    value: sessionPayload,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    domain: process.env.COOKIE_DOMAIN, // e.g., ".example.com" for subdomain support
    maxAge: 7 * 24 * 60 * 60,
  };
};
```

---

### 18. **Error on Empty Path Array**

**Current Problem:**
```typescript
const pathSegments = resolvedParams?.path || [];
const fullPath = `/${pathSegments.join("/")}`;
```

**Missing:**
- No handling of empty path
- `/api/` with no path segments

**What Could Happen:**
- Request to `/api/` forwards to `http://backend/`
- Unexpected behavior

**Fix Needed:**
```typescript
const pathSegments = resolvedParams?.path || [];

if (pathSegments.length === 0) {
  return NextResponse.json(
    { error: 'Invalid API endpoint' },
    { status: 400 }
  );
}

const fullPath = `/${pathSegments.join("/")}`;
```

---

### 19. **Content-Length Header Conflicts**

**Current Problem:**
```typescript
return new NextResponse(body, {
  status: response.status,
  statusText: response.statusText,
  headers: response.headers, // Forwarding all headers
});
```

**Missing:**
- Content-Length from backend may not match modified body
- Compression headers may be incorrect

**What Could Happen:**
- Browser truncates response
- Corrupt data
- Connection hangs

**Fix Needed:**
```typescript
function createNextResponse(response: Response, body: string): NextResponse {
  const headers = new Headers(response.headers);
  
  // Remove headers that need recalculation
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('transfer-encoding');
  
  return new NextResponse(body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}
```

---

### 20. **Memory Leaks in Long-Running Process**

**Current Problem:**
```typescript
// No cleanup of resources
// Potential memory leaks in production
```

**Missing:**
- No request cleanup
- Console.log in production
- No garbage collection hints

**What Could Happen:**
- Memory grows over time
- Server crashes after hours/days
- Performance degradation

**Fix Needed:**
```typescript
// Remove console.log in production or use proper logger
const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  }
};

// Proper cleanup
async function handleRequest(request: NextRequest, params: Promise<{ path: string[] }>) {
  try {
    // ... main logic
  } finally {
    // Cleanup if needed
  }
}
```

---

## 🔧 Additional Production Scenarios

### 21. **Load Balancer Health Checks**
- Backend URL might change
- Health checks hit proxy repeatedly
- Need to handle without authentication

### 22. **WebSocket Connections**
- Current implementation doesn't support WebSocket upgrade
- Real-time features won't work

### 23. **Multipart Form Data**
- File uploads need special handling
- Streaming vs buffering

### 24. **Request Cancellation**
- User navigates away during request
- Need to abort backend request

### 25. **Content Security Policy**
- CSP headers from backend might conflict
- Need to modify or pass through

### 26. **Compression**
- Responses might be gzipped
- Need to handle properly

### 27. **Caching**
- No cache headers
- Duplicate requests not deduplicated

### 28. **Logging & Audit Trail**
- No request/response logging
- Can't trace user actions
- Compliance issues

### 29. **Multi-Region/Multi-Backend**
- All requests go to single backend
- No failover support
- No geographic routing

### 30. **Version Mismatch**
- Frontend/backend version mismatch
- API breaking changes
- Need version negotiation

---

## 📊 Risk Assessment Matrix

| Scenario | Likelihood | Impact | Current Status | Priority |
|----------|-----------|--------|----------------|----------|
| Environment vars undefined | High | Critical | ❌ Not handled | P0 |
| Network timeout | Medium | High | ❌ Not handled | P0 |
| Malformed JSON response | Medium | High | ❌ Not handled | P0 |
| Concurrent token refresh | High | High | ❌ Not handled | P0 |
| Large file upload | Medium | High | ❌ Not handled | P1 |
| DDoS attack | Medium | Critical | ❌ Not handled | P1 |
| Session JWT expired | High | Medium | ⚠️ Partial | P1 |
| Backend 5xx errors | Medium | Medium | ❌ Not handled | P2 |
| CORS preflight | Low | Medium | ⚠️ Basic | P2 |
| Binary responses | Low | Medium | ❌ Not handled | P2 |

---

## ✅ Recommended Implementation Priority

### Phase 1: Critical (Week 1)
1. Environment variable validation
2. Network timeout handling
3. Malformed response validation
4. Concurrent refresh token fix
5. Error response standardization

### Phase 2: High Priority (Week 2-3)
6. Request/response size limits
7. Rate limiting
8. Retry logic for 5xx errors
9. Proper OPTIONS handling
10. JWT expiration handling

### Phase 3: Medium Priority (Week 4)
11. Binary/streaming response support
12. Health check endpoints
13. Logging and monitoring
14. Request cleanup
15. Cookie domain configuration

### Phase 4: Nice to Have
16. Query parameter sanitization
17. WebSocket support
18. Caching layer
19. Multi-backend support
20. Advanced security features

---

## 🎯 Conclusion

**Current State:** The proxy works for **happy path scenarios** but is **not production-ready**.

**Estimated Work:** 
- Critical fixes: 1-2 weeks
- Production-ready: 3-4 weeks
- Enterprise-grade: 6-8 weeks

**Recommendation:** Implement Phase 1 (Critical) immediately before deploying to production.
