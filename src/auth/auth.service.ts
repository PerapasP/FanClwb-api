import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  // Mock users database - replace with actual database
  private users = [
    {
      id: '1',
      email: 'admin@example.com',
      password: 'password123', // In real app, this should be hashed
      fullName: 'Admin User',
    },
    {
      id: '2',
      email: 'user@example.com',
      password: 'password123',
      fullName: 'Regular User',
    },
  ];

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    // Find user by email
    const user = this.users.find((u) => u.email === email);
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate mock JWT token (in real app, use @nestjs/jwt)
    const accessToken = `mock-jwt-token-${user.id}-${Date.now()}`;

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, fullName } = registerDto;
    // Check if user already exists
    const existingUser = this.users.find((u) => u.email === email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Create new user
    const newUser = {
      id: (this.users.length + 1).toString(),
      email,
      password, // In real app, hash this password
      fullName,
    };

    this.users.push(newUser);

    // Generate mock JWT token
    const accessToken = `mock-jwt-token-${newUser.id}-${Date.now()}`;

    return {
      access_token: accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
      },
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    // Find user by email
    const user = this.users.find((u) => u.email === email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // In real app, send email with reset token
    console.log(`Password reset requested for: ${email}`);
    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    // In real app, validate the refresh token
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new mock access token
    const newAccessToken = `mock-jwt-token-refreshed-${Date.now()}`;

    return {
      access_token: newAccessToken,
    };
  }
}
