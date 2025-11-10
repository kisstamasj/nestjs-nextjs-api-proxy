import { createZodDto } from 'nestjs-zod';
import { signUpSchema } from '../auth.schema';

export class SignUpDto extends createZodDto(signUpSchema) {}
