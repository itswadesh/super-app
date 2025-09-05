import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core'
import { User } from './user'
import { Order } from './order'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const HostRating = pgTable('vendor_ratings', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  hostId: uuid('host_id')
    .notNull()
    .references(() => User.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id),
  orderId: uuid('order_id')
    .notNull()
    .references(() => Order.id),
  rating: integer('rating').notNull(), // 1-5
  review: text('review'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type HostRating = typeof HostRating.$inferSelect
