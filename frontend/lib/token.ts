import { SESSION_TOKEN_COOKIE } from "./config";

export const getSessionTokenOption = (
  sessionPayload: string,
  maxAge?: number
) => {
  return {
    name: SESSION_TOKEN_COOKIE,
    value: sessionPayload,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAge || undefined, // If maxAge is not provided, the cookie will be a session cookie
  };
};
