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
import { User } from 'src/users/users.schema';

interface RequestWithUser extends Request {
  user: RequestUser;
}

type LoggedInUser = User & { accessToken: string; refreshToken: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @Post('sign-in')
  async login(@Req() req: RequestWithUser) {
    const user = req.user;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = req.ip;

    const { accessToken, refreshToken } = await this.authService.signTokens(
      user,
      userAgent,
      ipAddress,
    );

    const loggedInUser: LoggedInUser = { ...user, accessToken, refreshToken };

    return loggedInUser;
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
    const oldRefreshToken = req.user.refreshToken;

    const { accessToken, refreshToken } = await this.authService.signTokens(
      user,
      userAgent,
      ipAddress,
      oldRefreshToken,
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  @UseGuards(AuthGuard('jwt-access'))
  @Get('me')
  getProfile(@Req() req: RequestWithUser) {
    // dont return tokens
    const { accessToken, refreshToken, ...userWithoutTokens } = req.user;
    return userWithoutTokens;
  }

  @UseGuards(AuthGuard('jwt-access'))
  @Post('sign-out')
  async signOut(@Req() req: RequestWithUser) {
    const accessToken = req.user.accessToken;

    if (accessToken) {
      await this.authService.signOut(accessToken);
    }

    return { message: 'Successfully logged out.' };
  }
}
