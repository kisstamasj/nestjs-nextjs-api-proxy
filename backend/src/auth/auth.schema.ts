import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { User, users } from 'src/users/users.schema';
import z from 'zod';

export const tokens = pgTable(
  'tokens',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),
    userAgent: text('user_agent').notNull(),
    ipAddress: text('ip_address').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    primaryKey({
      name: 'tokens_pk',
      columns: [table.userId, table.refreshToken],
    }),
  ],
);

export type RequestUser = User & {
  refreshToken?: string;
};

export const signUpSchema = z
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
