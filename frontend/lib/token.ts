import { SESSION_TOKEN_COOKIE } from "./config";



const getTokenOptions = (name: string, value: string, maxAge: number) => {
  return {
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
};

export const getSessionTokenOption = (sessionPayload: string) => {
  return getTokenOptions(
    SESSION_TOKEN_COOKIE,
    sessionPayload,
    7 * 24 * 60 * 60 // seconds in 7 days
  );
};
