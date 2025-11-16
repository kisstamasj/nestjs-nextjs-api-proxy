import { BACKEND_API_URL } from "@/lib/config";
import { getAccessTokenOptions, getRefreshTokenOptions } from "@/lib/token";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const res = await fetch(`${BACKEND_API_URL}/auth/sign-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-agent": req.headers.get("user-agent") || "unknown",
      "x-forwarded-for": req.headers.get("x-forwarded-for") || "unknown",
    },
    body: req.body,
    // @ts-expect-error Next.js specific option
    duplex: "half",
  });

  const data = await res.json();

  console.log("Auth sign-in response data:", data);

  if (res.ok) {
    const { accessToken, refreshToken } = data;

    // Set HttpOnly cookies
    cookieStore.set(getAccessTokenOptions(accessToken));
    cookieStore.set(getRefreshTokenOptions(refreshToken));
  }

  const response = new Response(JSON.stringify(data), {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });

  return response;
}
