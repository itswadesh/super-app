import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { User } from './user'

export const Session = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id),
  expiresAt: timestamp('expires_at').notNull(),
})

export type Session = typeof Session.$inferSelect
