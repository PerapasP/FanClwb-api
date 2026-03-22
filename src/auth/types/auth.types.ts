export interface TempTokenPayload {
  sub: string;
  type: 'temp';
  iat: number;
  exp: number;
}

export interface AccessTokenPayload {
  sub: string;
  type: 'access';
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  iat: number;
  exp: number;
}
