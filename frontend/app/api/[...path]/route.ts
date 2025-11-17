import { BACKEND_API_URL, REFRESH_ENDPOINT, SESSION_TOKEN_COOKIE, SIGN_IN_ENDPOINT, SIGN_OUT_ENDPOINT } from "@/lib/config";
import { decrypt, encrypt, SessionPayload } from "@/lib/session";
import { getSessionTokenOption } from "@/lib/token";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getCookieValue(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

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

function createStreamingResponse(response: Response): NextResponse {
  const headers = new Headers(response.headers);
  
  // Preserve important headers for file downloads
  const contentType = response.headers.get('content-type');
  const contentDisposition = response.headers.get('content-disposition');
  
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

async function updateSessionCookie(
  response: NextResponse,
  sessionPayload: SessionPayload,
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const encryptedSession = await encrypt({
    ...sessionPayload,
    accessToken,
    refreshToken,
  });
  response.cookies.set(getSessionTokenOption(encryptedSession));
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshResponse | null> {
  try {
    console.log("Attempting to refresh access token");
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

    const refreshResponseData = await response.json();
    console.log("Token refresh response:", refreshResponseData);

    return refreshResponseData;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

function prepareHeaders(request: NextRequest, accessToken?: string): Headers {
  const headers = new Headers(request.headers);
  
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers.set("user-agent", userAgent);
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    headers.set("x-forwarded-for", forwardedFor);
  }

  headers.delete("host");
  headers.delete("cookie");

  return headers;
}

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
    // @ts-ignore - duplex is required for streaming but not in RequestInit type
    duplex: 'half',
  };

  console.log("Forwarding streaming request to backend:", backendUrl);

  return fetch(backendUrl, options);
}

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) => Promise<NextResponse>;

const createHandler: RouteHandler = (request, { params }) => 
  handleRequest(request, params);

export const GET = createHandler;
export const POST = createHandler;
export const PUT = createHandler;
export const DELETE = createHandler;
export const PATCH = createHandler;
export const OPTIONS = createHandler;

async function handleTokenRefresh(
  request: NextRequest,
  fullPath: string,
  sessionPayload: SessionPayload,
  refreshToken: string,
  cachedBody?: string
): Promise<NextResponse | null> {
  const refreshResult = await refreshAccessToken(refreshToken);

  if (!refreshResult) {
    const errorResponse = NextResponse.json(
      { error: "Unauthorized - Token refresh failed" },
      { status: 401 }
    );
    errorResponse.cookies.delete(SESSION_TOKEN_COOKIE);
    return errorResponse;
  }

  const response = await forwardRequest(request, fullPath, refreshResult.access_token, cachedBody);
  const data = await response.text();
  const nextResponse = createNextResponse(response, data);

  await updateSessionCookie(
    nextResponse,
    sessionPayload,
    refreshResult.access_token,
    refreshResult.refresh_token
  );

  return nextResponse;
}

async function handleSignIn(response: Response): Promise<NextResponse> {
  const data = await response.json();
  const nextResponse = createNextResponse(response, JSON.stringify(data));

  const { accessToken, refreshToken, id, email, firstName, lastName } = data;

  const sessionPayload = {
    id,
    email,
    firstName,
    lastName,
    accessToken,
    refreshToken,
  };

  const encryptedSession = await encrypt(sessionPayload);
  nextResponse.cookies.set(getSessionTokenOption(encryptedSession));

  return nextResponse;
}

async function handleSignOut(response: Response): Promise<NextResponse> {
  const data = await response.text();
  const nextResponse = createNextResponse(response, data);
  nextResponse.cookies.delete(SESSION_TOKEN_COOKIE);
  return nextResponse;
}

async function handleRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>
) {
  const sessionToken = await getCookieValue(SESSION_TOKEN_COOKIE);
  const sessionPayload = sessionToken ? await decrypt(sessionToken) : undefined;
  const accessToken = sessionPayload?.accessToken;
  const refreshToken = sessionPayload?.refreshToken;

  const resolvedParams = await params;
  const pathSegments = resolvedParams?.path || [];
  const fullPath = `/${pathSegments.join("/")}`;

  const contentType = request.headers.get('content-type') || '';
  
  // Check if this is a file upload (multipart/form-data) or large request
  const isFileUpload = contentType.includes('multipart/form-data');
  const isLargeRequest = contentType.includes('application/octet-stream');
  
  // For file uploads or large requests, stream directly without caching
  if (isFileUpload || isLargeRequest) {
    let response = await forwardRequestStreaming(request, fullPath, accessToken);
    
    // Handle token refresh on 401
    if (response.status === 401 && sessionPayload && refreshToken) {
      const refreshResult = await refreshAccessToken(refreshToken);
      
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
  const cachedBody = request.method !== "GET" && request.method !== "HEAD" 
    ? await request.text() 
    : undefined;

  let response = await forwardRequest(request, fullPath, accessToken, cachedBody);

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
    return handleSignIn(response);
  }

  // Handle sign-out endpoint
  if (fullPath === SIGN_OUT_ENDPOINT && response.ok) {
    return handleSignOut(response);
  }

  // Check if response is binary/streaming content (file download)
  const responseContentType = response.headers.get('content-type') || '';
  const isBinaryResponse = 
    responseContentType.includes('application/octet-stream') ||
    responseContentType.includes('application/pdf') ||
    responseContentType.includes('image/') ||
    responseContentType.includes('video/') ||
    responseContentType.includes('audio/') ||
    responseContentType.includes('application/zip') ||
    response.headers.get('content-disposition')?.includes('attachment');

  if (isBinaryResponse) {
    // Stream binary responses directly
    return createStreamingResponse(response);
  }

  // Forward the response as-is for text/JSON
  const data = await response.text();
  return createNextResponse(response, data);
}
