import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersService } from 'src/users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { User } from 'src/users/users.schema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signUpDto: SignUpDto): Promise<any> {
    const user = await this.userService.createUser({
      email: signUpDto.email,
      password: signUpDto.password,
      firstName: signUpDto.firstName,
      lastName: signUpDto.lastName,
    });

    return user;
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userService.findUserByEmail(email);

    if (user) {
      const isPasswordValid = await argon2.verify(user.password, password);

      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async signToken(user: User): Promise<any> {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
