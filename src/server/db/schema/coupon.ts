import { pgTable, varchar, decimal, boolean, timestamp, integer } from 'drizzle-orm/pg-core'
import { generateEntityId } from '../../utils'

export const Coupon = pgTable('coupons', {
  id: varchar('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateEntityId('coupon')),
  couponCode: varchar('coupon_code').notNull().unique(),
  discount: decimal('discount', { precision: 10, scale: 2 }).notNull(),
  discountType: varchar('discount_type').notNull(), // 'percentage' or 'fixed'
  maxDiscount: decimal('max_discount', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true).notNull(),
  validFrom: timestamp('valid_from'),
  validTo: timestamp('valid_to'),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').default(0).notNull(),
  description: varchar('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Coupon = typeof Coupon.$inferSelect
