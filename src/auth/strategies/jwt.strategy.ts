import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AccessTokenPayload } from '../types/auth.types';
import { JwtPayload } from '../interfaces/auth.interface';

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

  validate(payload: AccessTokenPayload): JwtPayload | null {
    if (payload.type !== 'access') return null;

    return {
      user_id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
