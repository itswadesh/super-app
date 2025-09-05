import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core'
import { Food } from './food'
import { User } from './user'
import { Order } from './order'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const FoodRating = pgTable('food_ratings', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  foodId: uuid('food_id')
    .notNull()
    .references(() => Food.id),
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

export type FoodRating = typeof FoodRating.$inferSelect
