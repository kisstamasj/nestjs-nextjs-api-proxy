import { BACKEND_API_URL } from "@/lib/config";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/token";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const res = await fetch(`${BACKEND_API_URL}/auth/sign-out`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-agent": req.headers.get("user-agent") || "unknown",
      "x-forwarded-for": req.headers.get("x-forwarded-for") || "unknown",
      Authorization: `Bearer ${
        cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || ""
      }`,
    },
  });

  const data = await res.json();

  console.log("Auth sign-out response data:", data);

  if (res.ok) {
    // Clear HttpOnly cookies
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
  }

  const response = new Response(JSON.stringify(data), {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });

  return response;
}
