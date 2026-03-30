// common/utils/cookie.util.ts
import { Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken?: string,
) => {
  res.cookie('access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });

  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('access_token', {
    ...COOKIE_OPTIONS,
  });

  res.clearCookie('refresh_token', {
    ...COOKIE_OPTIONS,
  });
};
