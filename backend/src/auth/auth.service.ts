import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersService } from 'src/users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { User } from 'src/users/users.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DrizzleService } from 'src/database/drizzle.service';
import { RequestUser, tokens } from './auth.schema';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly drizzle: DrizzleService,
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

  async signTokens(
    user: RequestUser,
    userAgent: string,
    ipAddress: string,
    oldRefreshToken?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user),
    ]);

    if (oldRefreshToken) {
      const existingTokens = await this.getTokenByRefreshToken(oldRefreshToken);

      if (existingTokens) {
        await this.drizzle.db
          .update(tokens)
          .set({ refreshToken, accessToken, updatedAt: sql`NOW()` })
          .where(eq(tokens.refreshToken, oldRefreshToken));
        return {
          accessToken,
          refreshToken,
        };
      }
    }

    await this.drizzle.db.insert(tokens).values({
      userId: user.id,
      accessToken,
      refreshToken,
      userAgent,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async getTokenByRefreshToken(refreshToken: string) {
    const [token] = await this.drizzle.db
      .select()
      .from(tokens)
      .where(eq(tokens.refreshToken, refreshToken));

    return token;
  }

  async getTokenByAccessToken(accessToken: string) {
    const [token] = await this.drizzle.db
      .select()
      .from(tokens)
      .where(eq(tokens.accessToken, accessToken));

    return token;
  }

  async signOut(accessToken: string): Promise<void> {
    await this.drizzle.db
      .delete(tokens)
      .where(eq(tokens.accessToken, accessToken));
  }

  async signAccessToken(user: RequestUser): Promise<string> {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: parseInt(
        this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
      ),
    });
  }

  async signRefreshToken(user: RequestUser): Promise<string> {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: parseInt(
        this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
      ),
    });
  }
}
