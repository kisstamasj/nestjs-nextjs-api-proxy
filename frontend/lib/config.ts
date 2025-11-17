if (!process.env.BACKEND_API_URL) {
  throw new Error("BACKEND_API_URL environment variable is required");
}
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters");
}

export const BACKEND_API_URL = process.env.BACKEND_API_URL;
export const SIGN_IN_ENDPOINT = "/auth/sign-in"; 
export const SIGN_OUT_ENDPOINT = "/auth/sign-out"; 
export const REFRESH_ENDPOINT = "/auth/refresh"; 
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const SESSION_TOKEN_COOKIE = "session_token";
