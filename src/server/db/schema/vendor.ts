import { pgTable, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { User } from './user'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const Vendor = pgTable('vendors', {
  id: varchar('id').primaryKey().$defaultFn(generateId),
  userId: varchar('user_id')
    .notNull()
    .references(() => User.id)
    .unique(),
  fullName: varchar('full_name').notNull(),
  email: varchar('email').notNull(),
  phone: varchar('phone').notNull(),
  experience: varchar('experience'),
  specializations: jsonb('specializations'), // array of cuisines
  kitchenEquipment: varchar('kitchen_equipment'),
  availableHours: varchar('available_hours'),
  deliveryRadius: varchar('delivery_radius'),
  businessLicense: varchar('business_license'), // file path/URL
  foodSafetyCertificate: varchar('food_safety_certificate'), // file path/URL
  idProof: varchar('id_proof').notNull(), // file path/URL
  address: varchar('address').notNull(),
  city: varchar('city').default('Bangalore'),
  pincode: varchar('pincode'),
  bankAccountNumber: varchar('bank_account_number'),
  bankName: varchar('bank_name'),
  ifscCode: varchar('ifsc_code'),
  upiId: varchar('upi_id'),
  status: varchar('status').default('pending'), // 'pending', 'approved', 'rejected'
  reviewedBy: varchar('reviewed_by').references(() => User.id), // admin who reviewed
  reviewNotes: varchar('review_notes'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Vendor = typeof Vendor.$inferSelect
