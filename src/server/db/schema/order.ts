import { pgTable, varchar, timestamp, decimal, jsonb } from 'drizzle-orm/pg-core'
import { User } from './user'
import { Payment } from './payment'
import { generateEntityId } from '../../utils'

export const Order = pgTable('orders', {
  id: varchar('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateEntityId('order')),
  userId: varchar('user_id')
    .notNull()
    .references(() => User.id),
  hostId: varchar('host_id')
    .notNull()
    .references(() => User.id),
  orderNumber: varchar('order_number').notNull().unique(),
  status: varchar('status').default('pending'), // 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('0.00'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0.00'),
  deliveryAddress: jsonb('delivery_address'), // address object
  specialInstructions: varchar('special_instructions'),
  estimatedDeliveryTime: timestamp('estimated_delivery_time'),
  actualDeliveryTime: timestamp('actual_delivery_time'),
  paymentStatus: varchar('payment_status').default('pending'), // 'pending', 'paid', 'failed', 'refunded'
  paymentMethod: varchar('payment_method'),
  paymentId: varchar('payment_id').references(() => Payment.id), // Reference to Payment table
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Order = typeof Order.$inferSelect
