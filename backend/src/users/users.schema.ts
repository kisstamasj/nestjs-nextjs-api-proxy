import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import z from 'zod';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type User = typeof users.$inferSelect;

export const insertUserSchema = z.object({
  email: z.string().email().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(4).max(100),
});

export const updateUserSchema = insertUserSchema.partial();

// all fields except password
export const publicUserFields = {
  id: users.id,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};
