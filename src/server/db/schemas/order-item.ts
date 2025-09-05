import { pgTable, text, integer, timestamp, decimal, uuid } from 'drizzle-orm/pg-core'
import { Order } from './order'
import { Food } from './food'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const OrderItem = pgTable('order_items', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  orderId: uuid('order_id')
    .notNull()
    .references(() => Order.id),
  foodId: uuid('food_id')
    .notNull()
    .references(() => Food.id),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  specialRequests: text('special_requests'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type OrderItem = typeof OrderItem.$inferSelect
