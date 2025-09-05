import { pgTable, text, timestamp, decimal, jsonb, uuid } from 'drizzle-orm/pg-core'
import { User } from './user'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const Order = pgTable('orders', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id),
  hostId: uuid('host_id')
    .notNull()
    .references(() => User.id),
  orderNumber: text('order_number').notNull().unique(),
  status: text('status').default('pending'), // 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('0.00'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0.00'),
  deliveryAddress: jsonb('delivery_address'), // address object
  specialInstructions: text('special_instructions'),
  estimatedDeliveryTime: timestamp('estimated_delivery_time'),
  actualDeliveryTime: timestamp('actual_delivery_time'),
  paymentStatus: text('payment_status').default('pending'), // 'pending', 'paid', 'failed', 'refunded'
  paymentMethod: text('payment_method'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Order = typeof Order.$inferSelect
