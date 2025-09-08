import { pgTable, varchar, integer, timestamp, decimal } from 'drizzle-orm/pg-core'
import { Order } from './order'
import { Food } from './food'
import { generateEntityId } from '../../utils'

export const OrderItem = pgTable('order_items', {
  id: varchar('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateEntityId('oi')),
  orderId: varchar('order_id')
    .notNull()
    .references(() => Order.id),
  foodId: varchar('food_id')
    .notNull()
    .references(() => Food.id),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  specialRequests: varchar('special_requests'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type OrderItem = typeof OrderItem.$inferSelect
