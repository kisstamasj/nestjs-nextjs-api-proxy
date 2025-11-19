import {
  BACKEND_API_URL,
  REFRESH_ENDPOINT,
} from "@/lib/config";
import { encrypt, getSessionTokenOption, SessionPayload, setSessionCookie } from "@/lib/session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * Retrieves a cookie value by name from the Next.js cookie store.
 * @param name - The name of the cookie to retrieve
 * @returns The cookie value or undefined if not found
 */
export async function getCookieValue(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

/**
 * Creates a NextResponse from a fetch Response with text body, removing headers that need recalculation.
 * @param response - The fetch Response object
 * @param body - The response body as a string
 * @returns A NextResponse object with cleaned headers
 */
export function createNextResponse(response: Response, body: string): NextResponse {
  const headers = new Headers(response.headers);

  // Remove headers that need recalculation
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("transfer-encoding");

  return new NextResponse(body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

/**
 * Creates a streaming NextResponse from a fetch Response, preserving the response body stream.
 * @param response - The fetch Response object with a streaming body
 * @returns A NextResponse object that streams the response body
 */
export function createStreamingResponse(response: Response): NextResponse {
  const headers = new Headers(response.headers);

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

/**
 * Refreshes the access token using the refresh token by calling the backend refresh endpoint.
 * @param refreshToken - The refresh token to use for authentication
 * @param userAgent - The user agent string from the original request
 * @param ipAddress - The IP address from the original request
 * @returns The new access and refresh tokens, or null if refresh failed
 */
export async function refreshAccessToken(
  refreshToken: string,
  userAgent: string,
  ipAddress: string
): Promise<RefreshResponse | null> {
  try {
    console.log("Attempting to refresh access token");
    const response = await fetch(`${BACKEND_API_URL}${REFRESH_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
        "user-agent": userAgent,
        "x-forwarded-for": ipAddress,
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

/**
 * Prepares request headers for forwarding to the backend, adding authorization and removing sensitive headers.
 * @param request - The incoming NextRequest object
 * @param accessToken - Optional access token to add to the Authorization header
 * @returns Prepared Headers object for the backend request
 */
export function prepareHeaders(request: NextRequest, accessToken?: string): Headers {
  const headers = new Headers(request.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers.set("user-agent", userAgent);
  }



  headers.delete("host");
  headers.delete("cookie");

  return headers;
}
