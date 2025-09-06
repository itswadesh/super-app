import {
  integer,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  pgTable,
  varchar
} from 'drizzle-orm/pg-core'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
// Import related schemas
import { generateEntityId } from '../../utils'

// Authors table
export const Author = pgTable(
  'authors',
  {
    id: varchar('id', { length: 256 })
      .primaryKey()
      .$defaultFn(() => generateEntityId('author')),
    name: varchar('name'),
    email: varchar('email'),
    phone: varchar('phone').unique(),
    username: varchar('username'),
    avatar: varchar('avatar'),
    bio: varchar('bio'),
    qualifications: varchar('qualifications'),
    achievements: varchar('achievements'),
    experience: varchar('experience'),
    subject: varchar('subject'),
    joinedDate: timestamp('joined_date', { mode: 'string' }),
    website: varchar('website'),
    twitter: varchar('twitter'),
    linkedin: varchar('linkedin'),
    instagram: varchar('instagram'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    rank: integer('rank').notNull().default(0),
    metaKeywords: varchar('meta_keywords'),
    metaTitle: varchar('meta_title'),
    metaDescription: varchar('meta_description'),
    migrationId: varchar('migration_id'),
    userId: varchar('user_id'),
    isActive: boolean('is_active').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow()
  },
  (table) => ({
    emailIdx: index('authors_email_idx').on(table.email),
    usernameIdx: index('authors_username_idx').on(table.username),
    userIdIdx: index('authors_user_id_idx').on(table.userId),
    isActiveIdx: index('authors_is_active_idx').on(table.isActive)
  })
)

// Export types
export type Author = InferSelectModel<typeof Author>
export type NewAuthor = InferInsertModel<typeof Author>
