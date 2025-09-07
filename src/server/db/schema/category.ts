import { pgTable, text, boolean, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const Category = pgTable('categories', {
  id: varchar('id').primaryKey().$defaultFn(generateId),
  name: varchar('name').notNull(),
  slug: varchar('slug').notNull().unique(),
  description: varchar('description'),
  image: varchar('image'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Category = typeof Category.$inferSelect
