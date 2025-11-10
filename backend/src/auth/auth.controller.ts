import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/users.schema';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { Request, Response } from 'express';

interface RequestWithUser extends Request {
  user: User;
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
    const token = await this.authService.signToken(user);
    res.cookie('Authentication', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.JWT_EXPIRATION) * 1000,
    });

    return user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('Authentication', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Azonnali lejárat
    });

    return { message: 'Sikeres kijelentkezés.' };
  }
}
