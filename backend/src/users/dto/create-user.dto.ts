import { createZodDto } from 'nestjs-zod';
import { insertUserSchema } from '../users.schema';

export class CreateUserDto extends createZodDto(insertUserSchema) {}
