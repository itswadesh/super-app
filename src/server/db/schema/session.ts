import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'
import { User } from './user'
import { generateEntityId } from '../../utils'

export const Session = pgTable('sessions', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => generateEntityId('sess')),
  userId: varchar('user_id')
    .notNull()
    .references(() => User.id),
  expiresAt: timestamp('expires_at').notNull(),
})

export type Session = typeof Session.$inferSelect
