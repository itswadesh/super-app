import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { User } from './user'

export const Session = pgTable('sessions', {
  id: varchar('id').primaryKey(),
  userId: varchar('user_id')
    .notNull()
    .references(() => User.id),
  expiresAt: timestamp('expires_at').notNull(),
})

export type Session = typeof Session.$inferSelect
