import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { TempTokenPayload } from './types/auth.types';

import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { SignInDto, SignUpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseService,
    private jwt: JwtService,
  ) {}

  private readonly SALT_ROUNDS = 10;

  private generateRefreshToken() {
    const tokenId = randomBytes(16).toString('hex');
    const token = randomBytes(48).toString('hex');

    return {
      full: `${tokenId}.${token}`,
      tokenId,
      token,
    };
  }

  async signUpWithEmail(dto: SignUpDto) {
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('อีเมลนี้ถูกใช้งานแล้ว');

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.prisma.users.create({
      data: {
        email: dto.email,
        fullname: dto.fullname,
        password: hashedPassword,
        auth_provider: 'email',
      },
    });

    const { full, tokenId, token } = this.generateRefreshToken();
    const hashedToken = await bcrypt.hash(token, this.SALT_ROUNDS);
    const refreshToken = full;

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: user.user_id,
        token_hash: hashedToken,
        token_id: tokenId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = this.signAccessToken(user.user_id);

    return { accessToken, refreshToken, user };
  }

  async signInWithEmail(dto: SignInDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.auth_provider !== 'email' || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const { full, tokenId, token } = this.generateRefreshToken();
    const hashedToken = await bcrypt.hash(token, this.SALT_ROUNDS);
    const refreshToken = full;

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: user.user_id,
        token_hash: hashedToken,
        token_id: tokenId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = this.signAccessToken(user.user_id);

    return { accessToken, refreshToken, user };
  }

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
          auth_provider: 'google',
        },
      });
    }

    const { full, tokenId, token } = this.generateRefreshToken();
    const hashedToken = await bcrypt.hash(token, this.SALT_ROUNDS);
    const refreshToken = full;

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: user.user_id,
        token_hash: hashedToken,
        token_id: tokenId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = this.signAccessToken(user.user_id);

    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    const [tokenId, token] = refreshToken.split('.');

    if (!tokenId || !token) {
      return;
    }

    const storedToken = await this.prisma.refresh_tokens.findUnique({
      where: { token_id: tokenId },
    });

    if (!storedToken) {
      return;
    }

    const isMatch = await bcrypt.compare(token, storedToken.token_hash);

    if (!isMatch) {
      return;
    }

    await this.prisma.refresh_tokens.delete({
      where: { id: storedToken.id },
    });
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

  async refreshAccessToken(refreshToken: string) {
    const [tokenId, rawToken] = refreshToken.split('.');

    if (!tokenId || !rawToken) {
      throw new UnauthorizedException('Invalid token format');
    }

    const token = await this.prisma.refresh_tokens.findFirst({
      where: { token_id: tokenId },
    });

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    const isMatch = await bcrypt.compare(rawToken, token.token_hash);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid token');
    }

    if (token.expires_at < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    const userId = token.user_id;

    // rotate
    await this.prisma.refresh_tokens.delete({
      where: { id: token.id },
    });

    const { full, tokenId: newId, token: newRaw } = this.generateRefreshToken();

    const hashed = await bcrypt.hash(newRaw, this.SALT_ROUNDS);

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: userId,
        token_id: newId,
        token_hash: hashed,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = this.signAccessToken(userId);

    return {
      accessToken,
      refreshToken: full,
    };
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
