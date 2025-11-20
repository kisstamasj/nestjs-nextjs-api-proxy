if (!process.env.BACKEND_API_URL) {
  throw new Error("BACKEND_API_URL environment variable is required");
}
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters");
}
if (!process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error("NEXT_PUBLIC_APP_URL environment variable is required");
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
export const BACKEND_API_URL = process.env.BACKEND_API_URL;
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const SIGN_IN_ENDPOINT = "/auth/sign-in";
export const SIGN_OUT_ENDPOINT = "/auth/sign-out";
export const REFRESH_ENDPOINT = "/auth/refresh";
export const SESSION_TOKEN_COOKIE = "session_token";
export const SESSION_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_SHORT_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours
