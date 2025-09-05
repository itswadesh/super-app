import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  uuid,
} from 'drizzle-orm/pg-core'
import { User } from './user'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const HostProfile = pgTable('host_profiles', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id)
    .unique(),
  bio: text('bio'),
  location: text('location'),
  cuisineSpecialties: jsonb('cuisine_specialties'), // array of cuisines
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalOrders: integer('total_orders').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type HostProfile = typeof HostProfile.$inferSelect
