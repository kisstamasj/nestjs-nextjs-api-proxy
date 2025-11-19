
import {
  BACKEND_API_URL,
  SESSION_EXPIRES_IN,
  SESSION_TOKEN_COOKIE,
  SIGN_IN_ENDPOINT,
  SIGN_OUT_ENDPOINT,
} from "@/lib/config";
import {
  createNextResponse,
  createStreamingResponse,
  getCookieValue,
  prepareHeaders,
  refreshAccessToken
} from "@/lib/proxy-utils";
import { decrypt, SessionPayload, setSessionCookie } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) => Promise<NextResponse>;

/**
 * Forwards a request to the backend API with optional body caching for retry scenarios.
 * @param request - The incoming NextRequest object
 * @param path - The API path to forward to
 * @param accessToken - Optional access token for authentication
 * @param cachedBody - Optional cached request body for retries
 * @returns The Response from the backend API
 */
async function forwardRequest(
  request: NextRequest,
  path: string,
  accessToken?: string,
  cachedBody?: string
): Promise<Response> {
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_API_URL}${path}${url.search}`;

  const headers = prepareHeaders(request, accessToken);

  const options: RequestInit = {
    method: request.method,
    headers,
  };

  if (cachedBody !== undefined) {
    options.body = cachedBody;
  }

  console.log("Forwarding request to backend:", backendUrl);

  return fetch(backendUrl, options);
}

/**
 * Forwards a streaming request to the backend API for file uploads or large payloads.
 * @param request - The incoming NextRequest object with streaming body
 * @param path - The API path to forward to
 * @param accessToken - Optional access token for authentication
 * @returns The Response from the backend API
 */
async function forwardRequestStreaming(
  request: NextRequest,
  path: string,
  accessToken?: string
): Promise<Response> {
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_API_URL}${path}${url.search}`;

  const headers = prepareHeaders(request, accessToken);

  const options: RequestInit = {
    method: request.method,
    headers,
    body: request.body, // Stream the body directly
    // @ts-expect-error - duplex is required for streaming but not in RequestInit type
    duplex: "half",
  };

  console.log("Forwarding streaming request to backend:", backendUrl);

  return fetch(backendUrl, options);
}

/**
 * Handles token refresh when a 401 is received, retries the original request with the new token.
 * @param request - The incoming NextRequest object
 * @param fullPath - The full API path being requested
 * @param sessionPayload - The current session data
 * @param refreshToken - The refresh token to use
 * @param cachedBody - Optional cached request body for the retry
 * @returns The NextResponse with updated session cookie, or null if refresh failed
 */
async function handleTokenRefresh(
  request: NextRequest,
  fullPath: string,
  sessionPayload: SessionPayload,
  refreshToken: string,
  cachedBody?: string
): Promise<NextResponse | null> {
  const refreshResult = await refreshAccessToken(
    refreshToken,
    request.headers.get("user-agent") || "unknown",
    request.headers.get("x-forwarded-for") || "unknown"
  );

  if (!refreshResult) {
    const errorResponse = NextResponse.json(
      { error: "Unauthorized - Token refresh failed" },
      { status: 401 }
    );
    errorResponse.cookies.delete(SESSION_TOKEN_COOKIE);
    return errorResponse;
  }

  const response = await forwardRequest(
    request,
    fullPath,
    refreshResult.access_token,
    cachedBody
  );
  const data = await response.text();
  const nextResponse = createNextResponse(response, data);

  await setSessionCookie(
    nextResponse.cookies,
    {
      ...sessionPayload,
      accessToken: refreshResult.access_token,
      refreshToken: refreshResult.refresh_token,
    },
    sessionPayload.rememberMe ? new Date(Date.now() + SESSION_EXPIRES_IN) : undefined
  );

  return nextResponse;
}

/**
 * Handles sign-in response by creating an encrypted session cookie with user data and tokens.
 * @param response - The Response from the sign-in endpoint
 * @returns NextResponse with the session cookie set
 */
async function handleSignIn(
  response: Response,
  rememberMe?: boolean
): Promise<NextResponse> {
  const data = await response.json();
  const nextResponse = createNextResponse(response, JSON.stringify(data));

  const {
    accessToken,
    refreshToken,
    id,
    email,
    firstName,
    lastName,
    createdAt,
    updatedAt,
  } = data;

  const sessionPayload: SessionPayload = {
    id,
    email,
    firstName,
    lastName,
    createdAt,
    updatedAt,
    accessToken,
    refreshToken,
    rememberMe: rememberMe || false,
  };

  console.log("data:", data);
  if (rememberMe) {
    // Persistent cookie (expires in 7 days)
    await setSessionCookie(nextResponse.cookies, sessionPayload, new Date(Date.now() + SESSION_EXPIRES_IN));
  } else {
    // Session cookie (expires when browser closes)
    await setSessionCookie(nextResponse.cookies, sessionPayload);
  }

  return nextResponse;
}

/**
 * Handles sign-out response by deleting the session cookie.
 * @param response - The Response from the sign-out endpoint
 * @returns NextResponse with the session cookie deleted
 */
async function handleSignOut(response: Response): Promise<NextResponse> {
  const data = await response.text();
  const nextResponse = createNextResponse(response, data);
  nextResponse.cookies.delete(SESSION_TOKEN_COOKIE);
  return nextResponse;
}

/**
 * Main request handler that proxies requests to the backend API with authentication and session management.
 * @param request - The incoming NextRequest object
 * @param params - Promise resolving to the path segments from the dynamic route
 * @returns NextResponse with the proxied backend response
 */
async function handleRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>
) {
  try {
    const sessionToken = await getCookieValue(SESSION_TOKEN_COOKIE);
    const sessionPayload = sessionToken ? await decrypt(sessionToken) : undefined;
    const accessToken = sessionPayload?.accessToken;
    const refreshToken = sessionPayload?.refreshToken;

    const resolvedParams = await params;
    const pathSegments = resolvedParams?.path || [];
    const fullPath = `/${pathSegments.join("/")}`;

    const contentType = request.headers.get("content-type") || "";

    // Check if this is a file upload (multipart/form-data) or large request
    const isFileUpload = contentType.includes("multipart/form-data");
    const isLargeRequest = contentType.includes("application/octet-stream");

    // For file uploads or large requests, stream directly without caching
    if (isFileUpload || isLargeRequest) {
      const response = await forwardRequestStreaming(
        request,
        fullPath,
        accessToken
      );

      // Handle token refresh on 401
      if (response.status === 401 && sessionPayload && refreshToken) {
        const refreshResult = await refreshAccessToken(
          refreshToken,
          request.headers.get("user-agent") || "unknown",
          request.headers.get("x-forwarded-for") || "unknown"
        );

        if (!refreshResult) {
          const errorResponse = NextResponse.json(
            { error: "Unauthorized - Token refresh failed" },
            { status: 401 }
          );
          errorResponse.cookies.delete(SESSION_TOKEN_COOKIE);
          return errorResponse;
        }

        // Note: Cannot retry file upload as body was already consumed
        // Client should retry the request
        return NextResponse.json(
          { error: "Authentication expired during upload. Please retry." },
          { status: 401 }
        );
      }

      // For file downloads, stream the response
      return createStreamingResponse(response);
    }

    // Cache request body before first request (body can only be read once)
    const cachedBody =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined;

    let response = await forwardRequest(
      request,
      fullPath,
      accessToken,
      cachedBody
    );

    // Handle token refresh on 401
    if (response.status === 401 && sessionPayload && refreshToken) {
      const refreshedResponse = await handleTokenRefresh(
        request,
        fullPath,
        sessionPayload,
        refreshToken,
        cachedBody
      );
      if (refreshedResponse) {
        response = refreshedResponse;
      }
    }

    // Handle sign-in endpoint
    if (fullPath === SIGN_IN_ENDPOINT && response.ok) {
      return handleSignIn(
        response,
        (cachedBody && JSON.parse(cachedBody).rememberMe) || false
      );
    }

    // Handle sign-out endpoint
    if (fullPath === SIGN_OUT_ENDPOINT && response.ok) {
      return handleSignOut(response);
    }

    // Check if response is binary/streaming content (file download)
    const responseContentType = response.headers.get("content-type") || "";
    const isBinaryResponse =
      responseContentType.includes("application/octet-stream") ||
      responseContentType.includes("application/pdf") ||
      responseContentType.includes("image/") ||
      responseContentType.includes("video/") ||
      responseContentType.includes("audio/") ||
      responseContentType.includes("application/zip") ||
      response.headers.get("content-disposition")?.includes("attachment");

    if (isBinaryResponse) {
      // Stream binary responses directly
      return createStreamingResponse(response);
    }

    // Forward the response as-is for text/JSON
    const data = await response.text();
    return createNextResponse(response, data);
  } catch (error) {
    console.error("API Proxy Error:", error);
    return NextResponse.json(
      { error: "Bad Gateway - Failed to connect to backend" },
      { status: 502 }
    );
  }
}

const createHandler: RouteHandler = (request, { params }) =>
  handleRequest(request, params);

export const GET = createHandler;
export const POST = createHandler;
export const PUT = createHandler;
export const DELETE = createHandler;
export const PATCH = createHandler;
export const OPTIONS = createHandler;
