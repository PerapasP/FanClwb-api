import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        const cookies = req.cookies as Record<string, string> | undefined;
        return cookies?.refresh_token ?? null;
      },
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: { sub: string; type: string },
  ): { userId: string; refreshToken: string } | null {
    if (payload.type !== 'refresh') return null;
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.refresh_token ?? '';
    return { userId: payload.sub, refreshToken };
  }
}
