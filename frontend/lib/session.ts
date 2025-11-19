

import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { SESSION_EXPIRES_IN, SESSION_SECRET, SESSION_TOKEN_COOKIE } from "./config";


const encodedKey = new TextEncoder().encode(SESSION_SECRET);

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionPayload extends JWTPayload, User {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(payload.rememberMe ? new Date(Date.now() + SESSION_EXPIRES_IN) : new Date(Date.now() + 60 * 60 * 1000))
    .sign(encodedKey);
}

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

export async function getUserSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_TOKEN_COOKIE)?.value;
  if (!sessionToken) {
    return null;
  }
  const session = await decrypt(sessionToken);

  if (!session) {
    return null;
  }

  const { accessToken, refreshToken, ...user } = session;
  return user as User;
}

export function getSessionTokenOption(token: string, expires?: Date) {
  return {
    name: SESSION_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export async function setSessionCookie(cookie: ResponseCookies, session: SessionPayload, expires?: Date) {
  const encryptedSession = await encrypt(session);
  cookie.set(getSessionTokenOption(encryptedSession, expires));
}
