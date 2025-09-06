import { pgTable, text, timestamp, decimal, jsonb, uuid } from 'drizzle-orm/pg-core'
import { User } from './user'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const Vendor = pgTable('vendors', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id)
    .unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  experience: text('experience'),
  specializations: jsonb('specializations'), // array of cuisines
  kitchenEquipment: text('kitchen_equipment'),
  availableHours: text('available_hours'),
  deliveryRadius: text('delivery_radius'),
  businessLicense: text('business_license'), // file path/URL
  foodSafetyCertificate: text('food_safety_certificate'), // file path/URL
  idProof: text('id_proof').notNull(), // file path/URL
  address: text('address').notNull(),
  city: text('city').default('Bangalore'),
  pincode: text('pincode'),
  bankAccountNumber: text('bank_account_number'),
  bankName: text('bank_name'),
  ifscCode: text('ifsc_code'),
  upiId: text('upi_id'),
  status: text('status').default('pending'), // 'pending', 'approved', 'rejected'
  reviewedBy: uuid('reviewed_by').references(() => User.id), // admin who reviewed
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Vendor = typeof Vendor.$inferSelect
