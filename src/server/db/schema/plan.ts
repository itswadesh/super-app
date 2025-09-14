import { pgTable, varchar, decimal, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { generateEntityId } from '../../utils'

export const Plan = pgTable('plans', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => generateEntityId('plan')),
  name: varchar('name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  validity: integer('validity').notNull(), // in days
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Plan = typeof Plan.$inferSelect
export type NewPlan = typeof Plan.$inferInsert
