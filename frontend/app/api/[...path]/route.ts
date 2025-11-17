import { BACKEND_API_URL, REFRESH_ENDPOINT, SESSION_TOKEN_COOKIE } from "@/lib/config";
import { decrypt, encrypt } from "@/lib/session";
import { getSessionTokenOption } from "@/lib/token";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Helper to get cookies from either request or server context
async function getCookieValue(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
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

async function forwardRequest(
  request: NextRequest,
  path: string,
  accessToken?: string
): Promise<Response> {
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_API_URL}${path}${url.search}`;

  // Get headers and add authorization
  const headers = new Headers(request.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // forward user-agent header
  if (request.headers.get("user-agent")) {
    headers.set("user-agent", request.headers.get("user-agent")!);
  }

  // forward ip address header
  if (request.headers.get("x-forwarded-for")) {
    headers.set("x-forwarded-for", request.headers.get("x-forwarded-for")!);
  }

  // Remove host and cookie headers to avoid conflicts
  headers.delete("host");
  headers.delete("cookie");

  const options: RequestInit = {
    method: request.method,
    headers,
  };

  // Add body for methods that support it
  if (request.method !== "GET" && request.method !== "HEAD") {
    options.body = await request.text();
  }

  console.log("Forwarding request to backend:", backendUrl);

  return fetch(backendUrl, options);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params);
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params);
}

async function handleRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>
) {
  // Get cookies from either request or server context
  const sessionToken = await getCookieValue(SESSION_TOKEN_COOKIE);
  const sessionPayload = sessionToken ? await decrypt(sessionToken) : undefined;
  let accessToken = sessionPayload?.accessToken || undefined;
  const refreshToken = sessionPayload?.refreshToken || undefined;

  const resolvedParams = await params;
  const pathSegments = resolvedParams?.path || [];
  const fullPath = `/${pathSegments.join("/")}`;

  // First attempt with current access token
  let response = await forwardRequest(request, fullPath, accessToken);

  // If unauthorized (401), try to refresh the token
  if (response.status === 401 && sessionPayload && refreshToken) {
    const refreshResult = await refreshAccessToken(refreshToken);

    if (refreshResult) {
      // Update tokens
      accessToken = refreshResult.access_token;

      // Retry the original request with new token
      response = await forwardRequest(request, fullPath, accessToken);

      // Create response with updated cookies
      const data = await response.text();
      const nextResponse = new NextResponse(data, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      const encryptedSession = await encrypt({
        ...sessionPayload,
        accessToken: refreshResult.access_token,
        refreshToken: refreshResult.refresh_token,
      });

      nextResponse.cookies.set(getSessionTokenOption(encryptedSession));

      return nextResponse;
    } else {
      // Refresh failed - clear cookies and return unauthorized
      const errorResponse = NextResponse.json(
        { error: "Unauthorized - Token refresh failed" },
        { status: 401 }
      );

      errorResponse.cookies.delete(SESSION_TOKEN_COOKIE);
      return errorResponse;
    }
  }

  // if signed out, clear cookies
  if (fullPath === "/auth/sign-out" && response.ok) {
    const data = await response.text();
    const nextResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    nextResponse.cookies.delete(SESSION_TOKEN_COOKIE);

    return nextResponse;
  }

  // Forward the response as-is
  const data = await response.text();
  const nextResponse = new NextResponse(data, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  return nextResponse;
}
