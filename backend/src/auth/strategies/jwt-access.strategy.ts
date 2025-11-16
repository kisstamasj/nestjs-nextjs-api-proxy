import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string }) {
    const user = await this.usersService.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = req.cookies?.access_token;

    const existingToken =
      await this.authService.getTokenByAccessToken(accessToken);

    if (!existingToken) {
      throw new UnauthorizedException('Access token not found in database');
    }

    return user;
  }
}
