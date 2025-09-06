import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  numeric,
  type AnyPgColumn
} from 'drizzle-orm/pg-core'
import { randomUUID } from 'crypto'

// Helper function to generate unique IDs
export const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${randomUUID().substring(0, 8)}`

export const commonFields = {
  id: (prefix: string) => ({
    id: varchar('id')
      .primaryKey()
      .$defaultFn(() => generateId(prefix))
  }),
  timestamps: {
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  }
}

// Helper function to create a table with common fields
export function createTable<T extends Record<string, any>>(name: string, columns: T) {
  return pgTable(name, {
    ...commonFields.id(
      name
        .split('_')
        .map((w) => w[0])
        .join('')
    ),
    ...commonFields.timestamps,
    ...columns
  } as const)
}

// Common field types
export const commonColumns = {
  // Text fields
  name: () => varchar('name'),
  email: () => varchar('email'),
  phone: () => varchar('phone'),
  description: () => varchar('description'),

  // Status fields
  isActive: () => boolean('is_active').default(true),
  isVerified: () => boolean('is_verified').default(false),
  isDeleted: () => boolean('is_deleted').default(false),

  // Numeric fields
  price: () => numeric('price', { precision: 10, scale: 2 }),
  quantity: () => integer('quantity').default(0),
  rating: () => numeric('rating', { precision: 3, scale: 2 }),

  // JSON fields
  metadata: () => jsonb('metadata').$type<Record<string, unknown>>(),

  // Relationships
  foreignKey: (name: string, table: AnyPgColumn) =>
    varchar(name).references(() => table, { onDelete: 'cascade' }),

  // Timestamps with timezone
  timestamp: (name: string) => timestamp(name, { withTimezone: true }),

  // Enum types
  status: (name: string, values: readonly [string, ...string[]]) => varchar(name, { enum: values })
}
