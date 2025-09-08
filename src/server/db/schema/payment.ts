import { pgTable, varchar, timestamp, decimal } from 'drizzle-orm/pg-core'
import { User } from './user'
import { generateEntityId } from '../../utils'

export const Payment = pgTable('payments', {
  id: varchar('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateEntityId('pay')),
  userId: varchar('user_id')
    .notNull()
    .references(() => User.id),
  orderNo: varchar('order_no').notNull(), // Base order number for customer
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar('payment_status').default('pending'), // 'pending', 'paid', 'failed', 'refunded'
  paymentMethod: varchar('payment_method').default('COD'),
  paymentReferenceId: varchar('payment_reference_id'), // External payment gateway reference
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Payment = typeof Payment.$inferSelect
