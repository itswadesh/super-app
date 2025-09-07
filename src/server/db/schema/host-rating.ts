import { pgTable, varchar, integer, timestamp } from 'drizzle-orm/pg-core'
import { User } from './user'
import { Order } from './order'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const HostRating = pgTable('vendor_ratings', {
  id: varchar('id').primaryKey().$defaultFn(generateId),
  hostId: varchar('host_id')
    .notNull()
    .references(() => User.id),
  userId: varchar('user_id')
    .notNull()
    .references(() => User.id),
  orderId: varchar('order_id')
    .notNull()
    .references(() => Order.id),
  rating: integer('rating').notNull(), // 1-5
  review: varchar('review'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type HostRating = typeof HostRating.$inferSelect
