import z from 'zod';

export const SignUpSchema = z
  .object({
    email: z.string().email().max(255),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    password: z.string().min(4).max(100),
    passwordConfirm: z.string().min(4).max(100),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });
