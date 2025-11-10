import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from 'src/users/users.schema';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  /**
   * A 'validate' metódus automatikusan lefut, amikor a 'local'
   * stratégiával védett végpontot (pl. /auth/signin) meghívjuk.
   * A 'usernameField' és 'passwordField' alapján kiolvassa
   * az 'email' és 'password' értékeket a request body-ból.
   */
  async validate(
    email: string,
    password_from_request: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.authService.validateUser(
      email,
      password_from_request,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
