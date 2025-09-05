import { pgTable, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const Category = pgTable('categories', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image: text('image'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Category = typeof Category.$inferSelect
