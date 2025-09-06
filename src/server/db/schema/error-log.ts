import {
  integer,
  text,
  boolean,
  timestamp,
  pgTable,
  varchar,
  index,
  unique,
  jsonb,
} from 'drizzle-orm/pg-core'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { User } from './user'
import { generateEntityId } from '../../utils'

// Note: enum replaced with plain text column in table definition

// Error logging table
export const ErrorLog = pgTable(
  'error_logs',
  {
    id: varchar('id', { length: 256 })
      .primaryKey()
      .$defaultFn(() => generateEntityId('elog')),
    fingerprint: varchar('fingerprint').notNull(), // Unique identifier for the error (source + message)
    source: varchar('source').notNull(), // Where the error happened (API endpoint, component, etc.)
    message: varchar('message').notNull(), // Error message
    details: varchar('details'), // Additional error details or stack trace (optional)
    stackTrace: text('stack_trace'), // Full stack trace if available
    metadata: jsonb('metadata').$type<Record<string, unknown>>(), // Additional metadata as JSON
    category: varchar('category').notNull().default('general'),
    statusCode: integer('status_code'), // HTTP status code if applicable
    userId: varchar('user_id'), // User who encountered the error (if applicable)
    userAgent: varchar('user_agent'), // User agent string
    ipAddress: varchar('ip_address'), // IP address of the client
    occurrences: integer('occurrences').notNull().default(1), // How many times this error has happened
    firstSeen: timestamp('first_seen', { mode: 'string' }).notNull(), // When the error was first logged
    lastSeen: timestamp('last_seen', { mode: 'string' }).notNull(), // When the error was most recently seen
    isViewed: boolean('is_viewed').notNull().default(false), // Whether the error has been viewed by an admin
    isResolved: boolean('is_resolved').notNull().default(false), // Whether the error has been resolved
    isIgnored: boolean('is_ignored').notNull().default(false), // Whether the error should be ignored (won't show in primary list)
    ignoredReason: varchar('ignored_reason'), // Optional reason for ignoring this error
    resolvedAt: timestamp('resolved_at', { mode: 'string' }), // When the error was marked as resolved
    resolvedBy: varchar('resolved_by'), // Admin who resolved the error
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    fingerprintIdx: index('error_logs_fingerprint_idx').on(table.fingerprint),
    sourceIdx: index('error_logs_source_idx').on(table.source),
    categoryIdx: index('error_logs_category_idx').on(table.category),
    statusCodeIdx: index('error_logs_status_code_idx').on(table.statusCode),
    userIdIdx: index('error_logs_user_id_idx').on(table.userId),
    isViewedIdx: index('error_logs_is_viewed_idx').on(table.isViewed),
    isResolvedIdx: index('error_logs_is_resolved_idx').on(table.isResolved),
    isIgnoredIdx: index('error_logs_is_ignored_idx').on(table.isIgnored),
    firstSeenIdx: index('error_logs_first_seen_idx').on(table.firstSeen),
    lastSeenIdx: index('error_logs_last_seen_idx').on(table.lastSeen),
    uniqueFingerprint: unique('error_logs_fingerprint_unique').on(table.fingerprint),
  })
)

// Error occurrence log - tracks each instance of an error
export const ErrorOccurrence = pgTable(
  'error_occurrences',
  {
    id: varchar('id', { length: 256 })
      .primaryKey()
      .$defaultFn(() => generateEntityId('eocc')),
    errorId: varchar('error_id')
      .notNull()
      .references(() => ErrorLog.id, { onDelete: 'cascade' }),
    timestamp: timestamp('timestamp', { mode: 'string' }).notNull().defaultNow(),
    userId: varchar('user_id'),
    userAgent: varchar('user_agent'),
    ipAddress: varchar('ip_address'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    url: varchar('url'),
    method: varchar('method'),
    headers: jsonb('headers').$type<Record<string, string>>(),
    query: jsonb('query').$type<Record<string, unknown>>(),
    body: text('body'),
  },
  (table) => ({
    errorIdIdx: index('error_occurrences_error_id_idx').on(table.errorId),
    timestampIdx: index('error_occurrences_timestamp_idx').on(table.timestamp),
    userIdIdx: index('error_occurrences_user_id_idx').on(table.userId),
  })
)

// Error resolution notes
export const ErrorNote = pgTable(
  'error_notes',
  {
    id: varchar('id', { length: 256 })
      .primaryKey()
      .$defaultFn(() => generateEntityId('enote')),
    errorId: varchar('error_id')
      .notNull()
      .references(() => ErrorLog.id, { onDelete: 'cascade' }),
    userId: varchar('user_id')
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    isInternal: boolean('is_internal').notNull().default(false), // Whether the note is for internal use only
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    errorIdIdx: index('error_notes_error_id_idx').on(table.errorId),
    userIdIdx: index('error_notes_user_id_idx').on(table.userId),
    createdAtIdx: index('error_notes_created_at_idx').on(table.createdAt),
  })
)

// Export types
export type ErrorLog = InferSelectModel<typeof ErrorLog>
export type NewErrorLog = InferInsertModel<typeof ErrorLog>
export type ErrorOccurrence = InferSelectModel<typeof ErrorOccurrence>
export type NewErrorOccurrence = InferInsertModel<typeof ErrorOccurrence>
export type ErrorNote = InferSelectModel<typeof ErrorNote>
export type NewErrorNote = InferInsertModel<typeof ErrorNote>
