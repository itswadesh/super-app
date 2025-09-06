import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  uuid,
} from 'drizzle-orm/pg-core'
import { User } from './user'
import { Category } from './category'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const Food = pgTable('foods', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  hostId: uuid('host_id')
    .notNull()
    .references(() => User.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  image: text('image'),
  categoryId: uuid('category_id').references(() => Category.id),
  ingredients: jsonb('ingredients'), // array of ingredients
  allergens: jsonb('allergens'), // array of allergens
  preparationTime: integer('preparation_time'), // in minutes
  servingSize: text('serving_size'),
  isAvailable: boolean('is_available').default(true),
  isVegetarian: boolean('is_vegetarian').default(false),
  isVegan: boolean('is_vegan').default(false),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalRatings: integer('total_ratings').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Food = typeof Food.$inferSelect
