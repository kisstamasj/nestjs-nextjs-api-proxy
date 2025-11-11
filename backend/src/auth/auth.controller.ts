import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { RequestUser } from './auth.schema';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';

interface RequestWithUser extends Request {
  user: RequestUser;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @Post('signin')
  async login(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = req.ip;

    const { accessToken, refreshToken } = await this.authService.signTokens(
      user,
      userAgent,
      ipAddress,
    );

    this.setAuthCookie(res, accessToken, refreshToken);

    return user;
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refreshTokens(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = req.ip;
    const oldRefreshToken = (req.user as any).refreshToken;

    const { accessToken, refreshToken } = await this.authService.signTokens(
      user,
      userAgent,
      ipAddress,
      oldRefreshToken,
    );

    // Set new cookies directly instead of clearing first to avoid race conditions
    this.setAuthCookie(res, accessToken, refreshToken);

    const { refreshToken: _, ...userWithoutRefreshToken } = user;

    return userWithoutRefreshToken;
  }

  @UseGuards(AuthGuard('jwt-access'))
  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt-access'))
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const refreshToken = res.req.cookies?.refresh_token;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    this.clearAuthCookies(res);

    return { message: 'Successfully logged out.' };
  }

  private setAuthCookie(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/', // Explicitly set path
    };

    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge:
        parseInt(
          this.authService['configService'].get<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
          ),
        ) * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      path: '/auth/refresh', // Refresh token cookie only sent to /auth/refresh
      maxAge:
        parseInt(
          this.authService['configService'].get<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
          ),
        ) * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    const clearOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    res.clearCookie('access_token', clearOptions);
    res.clearCookie('refresh_token', clearOptions);
  }
}
