import { createZodDto } from 'nestjs-zod';
import { SignUpSchema } from '../auth.schema';

export class SignUpDto extends createZodDto(SignUpSchema) {}
