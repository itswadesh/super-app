import { pgTable, integer, timestamp, varchar } from 'drizzle-orm/pg-core'
import { Product } from './product'
import { User } from './user'
import { Order } from './order'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const FoodRating = pgTable('food_ratings', {
  id: varchar('id').primaryKey().$defaultFn(generateId),
  foodId: varchar('food_id')
    .notNull()
    .references(() => Product.id),
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

export type FoodRating = typeof FoodRating.$inferSelect
