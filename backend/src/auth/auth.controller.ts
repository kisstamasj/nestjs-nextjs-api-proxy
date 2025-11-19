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
import { RequestUser, Token } from './auth.schema';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { User } from 'src/users/users.schema';

interface RequestWithUser extends Request {
  user: RequestUser;
}

interface RefreshTokenPayload extends Request {
  user: {
    user: User;
    tokenRecord: Token;
    isGracePeriod: boolean;
  };
}

type LoggedInUser = User & { accessToken: string; refreshToken: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @Post('sign-in')
  async login(@Req() req: RequestWithUser, @Body() body: { rememberMe: boolean }) {
    const user = req.user;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = req.ip;

    const { accessToken, refreshToken } = await this.authService.createTokens(
      user,
      userAgent,
      ipAddress,
      body.rememberMe,
    );

    const loggedInUser: LoggedInUser = { ...user, accessToken, refreshToken };

    return loggedInUser;
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refreshTokens(
    @Req() req: RefreshTokenPayload,
    @Res({ passthrough: true }) res: Response,
    @Body() body: { rememberMe: boolean }
  ) {
    const user = req.user.user;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = req.ip;
    const isGracePeriod = req.user.isGracePeriod;
    const record = req.user.tokenRecord;

    if (isGracePeriod) {
      return {
        access_token: await this.authService.generateNewAccessOnly(
          user,
          userAgent,
          ipAddress,
          record.refreshToken,
        ),
        refresh_token: record.refreshToken,
      };
    }

    const { accessToken, refreshToken } = await this.authService.rotateTokens(
      user,
      record.refreshToken,
      userAgent,
      ipAddress,
      body.rememberMe,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
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
