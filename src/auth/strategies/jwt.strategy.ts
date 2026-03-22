import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        const cookies = req.cookies as Record<string, string> | undefined;
        return cookies?.access_token ?? null;
      },
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
    });
  }

  validate(payload: { sub: string; type: string }): { userId: string } | null {
    if (payload.type !== 'access') return null;
    return { userId: payload.sub };
  }
}
