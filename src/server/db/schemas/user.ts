import { pgTable, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const User = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  name: text('name').notNull().unique(),
  businessName: text('business_name'),
  email: text('email').notNull(),
  phone: text('phone').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('user'), // 'user', 'host', 'admin'
  isVerified: boolean('is_verified').default(false),
  avatar: text('avatar'),
  status: text('status').default('pending'), // 'pending', 'approved', 'rejected'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type User = typeof User.$inferSelect
