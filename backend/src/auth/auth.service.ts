import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { and, eq, lt } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import { User } from 'src/users/users.schema';
import { UsersService } from 'src/users/users.service';
import { RequestUser, tokens } from './auth.schema';
import { SignUpDto } from './dto/signup.dto';

const GRACE_PERIOD_MS = 20 * 1000; // 20 seconds
const REFRESH_TOKEN_SHORT_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly drizzle: DrizzleService,
  ) { }

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

  async createTokens(
    user: RequestUser,
    userAgent: string,
    ipAddress: string,
    rememberMe: boolean,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user, rememberMe),
    ]);

    await this.drizzle.db.insert(tokens).values({
      userId: user.id,
      accessToken,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt: rememberMe ? new Date(Date.now() + parseInt(
        this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
      ) * 1000) : new Date(Date.now() + REFRESH_TOKEN_SHORT_EXPIRATION_TIME),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async rotateTokens(
    user: RequestUser,
    currentRefreshToken: string,
    userAgent: string,
    ipAddress: string,
    rememberMe: boolean,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user, rememberMe),
    ]);

    // Frissítjük a token rekordot az új tokenekkel, és beállítjuk a previousRefreshToken mezőt
    await this.drizzle.db
      .update(tokens)
      .set({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        previousRefreshToken: currentRefreshToken,
        previousRefreshTokenExpiresAt: new Date(Date.now() + GRACE_PERIOD_MS),
        expiresAt: rememberMe ? new Date(Date.now() + parseInt(
          this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
        ) * 1000) : new Date(Date.now() + REFRESH_TOKEN_SHORT_EXPIRATION_TIME),
        userAgent,
        ipAddress,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tokens.userId, user.id),
          eq(tokens.refreshToken, currentRefreshToken),
        ),
      );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async generateNewAccessOnly(
    user: RequestUser,
    userAgent: string,
    ipAddress: string,
    refreshToken: string,
  ): Promise<string> {
    const newAccessToken = await this.signAccessToken(user);

    // Frissítjük csak az access tokent a token rekordban
    await this.drizzle.db
      .update(tokens)
      .set({
        accessToken: newAccessToken,
        userAgent,
        ipAddress,
        updatedAt: new Date(),
      })
      .where(
        and(eq(tokens.userId, user.id), eq(tokens.refreshToken, refreshToken)),
      );

    return newAccessToken;
  }

  async validateRefreshTokenLogic(
    userId: string,
    incomingRefreshToken: string,
  ) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 1. Keressük meg a userhez tartozó token rekordot
    const tokenRecords = await this.drizzle.db
      .select()
      .from(tokens)
      .where(eq(tokens.userId, userId));

    // Mivel a PK-ban van a token, így keresünk a memóriában a rekordok között:
    const record = tokenRecords.find(
      (t) =>
        t.refreshToken === incomingRefreshToken ||
        t.previousRefreshToken === incomingRefreshToken,
    );

    if (!record) throw new UnauthorizedException('Token not found');

    // A. ESET: Ez a friss, aktuális token -> OK, mehet tovább a controllerbe rotálni
    if (record.refreshToken === incomingRefreshToken) {
      return {
        user,
        tokenRecord: record,
        isGracePeriod: false,
      };
    }

    // B. ESET: Grace Period ellenőrzés
    const now = new Date();
    if (
      record.previousRefreshToken === incomingRefreshToken &&
      record.previousRefreshTokenExpiresAt &&
      record.previousRefreshTokenExpiresAt > now
    ) {
      // FONTOS: Jelezzük, hogy ez Grace Period találat!
      return { user, tokenRecord: record, isGracePeriod: true };
    }

    // C. ESET: Lejárt vagy érvénytelen -> A Guard itt fog elhasalni
    throw new UnauthorizedException('Token expired or reused');
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

  async signRefreshToken(user: RequestUser, rememberMe: boolean): Promise<string> {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      // If rememberMe is true, use the refresh token expiration time from the config, otherwise use 1 day
      expiresIn: rememberMe ? parseInt(
        this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
      ) : '1d',
    });
  }

  async removeExpiredTokens(userId: string) {
    await this.drizzle.db
      .delete(tokens)
      .where(
        and(
          eq(tokens.userId, userId),
          lt(tokens.expiresAt, new Date()),
        ),
      );
  }
}
