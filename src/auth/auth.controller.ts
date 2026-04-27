import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  ValidationPipe,
  UsePipes,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { clearAuthCookies, setAuthCookies } from '../common/utils/cookie.util';
import { SignInDto, SignUpDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwt: JwtService,
  ) {}

  @UsePipes(new ValidationPipe())
  @Post('signup')
  async signUp(@Body() dto: SignUpDto, @Res() res: Response) {
    const { accessToken, refreshToken, user } =
      await this.authService.signUpWithEmail(dto);

    setAuthCookies(res, accessToken, refreshToken);

    return res.json({ user });
  }

  @UsePipes(new ValidationPipe())
  @Post('signin')
  async signIn(@Body() dto: SignInDto, @Res() res: Response) {
    const { accessToken, refreshToken, user } =
      await this.authService.signInWithEmail(dto);

    setAuthCookies(res, accessToken, refreshToken);

    return res.json({ user });
  }

  @Post('google')
  async googleLogin(@Body('idToken') idToken: string, @Res() res: Response) {
    const { accessToken, refreshToken } =
      await this.authService.loginWithGoogle(idToken);

    setAuthCookies(res, accessToken, refreshToken);

    return res.json({ code: 200, message: 'Login successful' });
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshAccessToken(refreshToken);

    setAuthCookies(res, accessToken, newRefreshToken);

    return res.json({ success: true });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'] as string | undefined;

    if (refreshToken) {
      try {
        await this.authService.logout(refreshToken);
      } catch {
        // comment clear
      }
    }

    clearAuthCookies(res);

    return res.json({ success: true, message: 'Logged out successfully' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & { user: { userId: string } }) {
    return this.authService.getMe(req.user.userId);
  }
}
