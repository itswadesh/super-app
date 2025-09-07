import { text, integer, boolean, timestamp, varchar, index, pgTable } from 'drizzle-orm/pg-core'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { generateEntityId } from './../../utils'

// Using pgTable directly for more control over PostgreSQL-specific features

// Note: enum replaced with plain text column in table definition

// User table
export const User = pgTable(
  'users',
  {
    id: varchar('id', { length: 256 })
      .primaryKey()
      .$defaultFn(() => generateEntityId('user')),
    name: varchar('name'),
    email: varchar('email'),
    phone: varchar('phone').notNull().unique(),
    role: varchar('role').default('user'),
    avatar: varchar('avatar'),
    otp: varchar('otp'),
    otpRequestedAt: timestamp('otp_requested_at', { mode: 'string' }).defaultNow().notNull(),
    migrationId: varchar('migration_id'),
    isActive: boolean('is_active').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    phoneIdx: index('users_phone_idx').on(table.phone),
    roleIdx: index('users_role_idx').on(table.role),
  })
)

// Session table
export const Session = pgTable(
  'sessions',
  {
    id: varchar('id', { length: 256 })
      .primaryKey()
      .$defaultFn(() => generateEntityId('session')),
    userId: varchar('user_id')
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    token: varchar('token').notNull().unique(),
    userAgent: varchar('user_agent'),
    ipAddress: varchar('ip_address'),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    tokenIdx: index('sessions_token_idx').on(table.token),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  })
)

// Export types
export type User = InferSelectModel<typeof User>
export type NewUser = InferInsertModel<typeof User>
export type Session = InferSelectModel<typeof Session>
export type NewSession = InferInsertModel<typeof Session>
