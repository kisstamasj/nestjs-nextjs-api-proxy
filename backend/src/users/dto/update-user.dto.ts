import { createZodDto } from 'nestjs-zod';
import { updateUserSchema } from '../users.schema';

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
