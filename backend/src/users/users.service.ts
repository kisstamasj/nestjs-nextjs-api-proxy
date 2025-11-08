import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import * as schema from './users.schema';
import { publicUserFields } from './users.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private drizzle: DrizzleService) {}

  async getAllUsers(): Promise<Omit<schema.User, 'password'>[]> {
    return this.drizzle.db.select(publicUserFields).from(schema.users);
  }

  async createUser(
    data: CreateUserDto,
  ): Promise<Omit<schema.User, 'password'>> {
    const emailExists = await this.drizzle.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, data.email))
      .limit(1)
      .execute();

    if (emailExists.length > 0) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await argon2.hash(data.password);
    const [user] = await this.drizzle.db
      .insert(schema.users)
      .values({
        email: data.email,
        password: passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      })
      .returning(publicUserFields);
    return user;
  }

  async getUserById(id: string): Promise<Omit<schema.User, 'password'> | null> {
    const [user] = await this.drizzle.db
      .select(publicUserFields)
      .from(schema.users)
      .where(eq(schema.users.id, id));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(
    id: string,
    data: any,
  ): Promise<Omit<schema.User, 'password'> | null> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const [updatedUser] = await this.drizzle.db
      .update(schema.users)
      .set(data)
      .where(eq(schema.users.id, id))
      .returning(publicUserFields);
    return updatedUser || null;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.drizzle.db.delete(schema.users).where(eq(schema.users.id, id));
  }
}
