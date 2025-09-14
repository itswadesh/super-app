import { pgTable, varchar, timestamp, boolean } from 'drizzle-orm/pg-core'
import { User } from './user'
import { Plan } from './plan'
import { generateEntityId } from '../../utils'

export const subscriptions = pgTable('subscriptions', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => generateEntityId('subscription')),
  userId: varchar('user_id')
    .notNull()
    .references(() => User.id),
  planId: varchar('plan_id')
    .notNull()
    .references(() => Plan.id),
  orderId: varchar('order_id').notNull(),
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to').notNull(),
  status: varchar('status').notNull().default('active'), // active, cancelled
  autoRenew: boolean('auto_renew').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
