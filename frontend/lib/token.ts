export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

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

export const getAccessTokenOptions = (value: string) => {
  return getTokenOptions(ACCESS_TOKEN_COOKIE, value, 15 * 60);
};

export const getRefreshTokenOptions = (value: string) => {
  return getTokenOptions(REFRESH_TOKEN_COOKIE, value, 7 * 24 * 60 * 60);
};
