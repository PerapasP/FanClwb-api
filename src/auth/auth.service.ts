import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { TempTokenPayload } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseService,
    private jwt: JwtService,
  ) {}

  async loginWithGoogle(idToken: string) {
    const decoded = await this.firebase.verifyIdToken(idToken).catch(() => {
      throw new UnauthorizedException('Invalid Google token');
    });

    const isGoogleProvider = decoded.firebase.sign_in_provider === 'google.com';
    if (!isGoogleProvider)
      throw new UnauthorizedException('Not a Google login');

    let user = await this.prisma.users.findUnique({
      where: { social_id: decoded.uid },
    });

    if (!user) {
      user = await this.prisma.users.create({
        data: {
          social_id: decoded.uid,
          email: decoded.email!,
          fullname: typeof decoded.name === 'string' ? decoded.name : null,
        },
      });
    }

    const accessToken = this.signAccessToken(user.user_id);
    const refreshToken = this.signRefreshToken(user.user_id);

    return { accessToken, refreshToken };
  }

  async verifyPhone(userId: string, phoneIdToken: string) {
    try {
      const decoded = await this.firebase
        .verifyIdToken(phoneIdToken)
        .catch(() => {
          throw new UnauthorizedException('Invalid phone token');
        });

      const isPhoneProvider = decoded.firebase.sign_in_provider === 'phone';
      if (!isPhoneProvider)
        throw new UnauthorizedException('Not a phone login');

      const user = await this.prisma.users.update({
        where: { user_id: userId },
        data: {
          phone_number: decoded.phone_number,
          is_verified: true,
        },
      });

      const accessToken = this.signAccessToken(user.user_id);
      const refreshToken = this.signRefreshToken(user.user_id);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new UnauthorizedException('Error: ' + error);
    }
  }

  async refreshAccessToken(userId: string): Promise<string> {
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) throw new UnauthorizedException('User not found');

    return this.signAccessToken(user.user_id);
  }

  async getMe(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private signTempToken(userId: string) {
    return this.jwt.sign(
      { sub: userId, type: 'temp' },
      { secret: process.env.JWT_TEMP_SECRET, expiresIn: '10m' },
    );
  }

  private signAccessToken(userId: string) {
    return this.jwt.sign(
      { sub: userId, type: 'access' },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      },
    );
  }

  private signRefreshToken(userId: string) {
    return this.jwt.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '30d',
      },
    );
  }

  verifyTempToken(token: string): TempTokenPayload {
    return this.jwt.verify(token, {
      secret: process.env.JWT_TEMP_SECRET,
    });
  }
}
