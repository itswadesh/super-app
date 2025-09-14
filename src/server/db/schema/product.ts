import { pgTable, integer, boolean, timestamp, decimal, jsonb, varchar } from 'drizzle-orm/pg-core'
import { User } from './user'
import { Category } from './category'
import { generateEntityId } from '../../utils'

export const Product = pgTable('products', {
  id: varchar('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => generateEntityId('prod')),
  hostId: varchar('host_id')
    .notNull()
    .references(() => User.id),
  title: varchar('title').notNull(),
  titleEnglish: varchar('title_english').notNull(),
  slug: varchar('slug').notNull().unique(),
  description: varchar('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  image: varchar('image'),
  categoryId: varchar('category_id').references(() => Category.id),
  ingredients: jsonb('ingredients'), // array of ingredients
  allergens: jsonb('allergens'), // array of allergens
  preparationTime: integer('preparation_time'), // in minutes
  servingSize: varchar('serving_size'),
  isAvailable: boolean('is_available').default(true),
  isVegetarian: boolean('is_vegetarian').default(false),
  isVegan: boolean('is_vegan').default(false),
  thumbnail: varchar('thumbnail'),
  fileUrl: varchar('file_url'),
  estimatedTime: integer('estimated_time'),
  images: jsonb('images'), // array of image URLs
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  rank: integer('rank').default(0),
  type: varchar('type').default('food'),
  popularity: integer('popularity').default(0),
  metaKeywords: varchar('meta_keywords'),
  metaTitle: varchar('meta_title'),
  metaDescription: varchar('meta_description'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalRatings: integer('total_ratings').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Product = typeof Product.$inferSelect
