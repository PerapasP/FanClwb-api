import { UserRole, users } from '@prisma/client';

export interface TempTokenPayload {
  sub: string;
  type: 'temp';
  iat?: number;
  exp?: number;
}

export interface AccessTokenPayload {
  sub: string;
  email: string | null;
  role: UserRole;
  type: 'access';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user?: users;
}
