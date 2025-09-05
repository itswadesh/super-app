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

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

export const User = pgTable('user', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('buyer'), // 'buyer', 'host', 'admin'
  isVerified: boolean('is_verified').default(false),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const Session = pgTable('session', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id),
  expiresAt: timestamp('expires_at').notNull(),
})

export const HostProfile = pgTable('host_profile', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id)
    .unique(),
  bio: text('bio'),
  location: text('location'),
  cuisineSpecialties: jsonb('cuisine_specialties'), // array of cuisines
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalOrders: integer('total_orders').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const Category = pgTable('category', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image: text('image'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const Food = pgTable('food', {
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

export const Order = pgTable('order', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  buyerId: uuid('buyer_id')
    .notNull()
    .references(() => User.id),
  hostId: uuid('host_id')
    .notNull()
    .references(() => User.id),
  orderNumber: text('order_number').notNull().unique(),
  status: text('status').default('pending'), // 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('0.00'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0.00'),
  deliveryAddress: jsonb('delivery_address'), // address object
  specialInstructions: text('special_instructions'),
  estimatedDeliveryTime: timestamp('estimated_delivery_time'),
  actualDeliveryTime: timestamp('actual_delivery_time'),
  paymentStatus: text('payment_status').default('pending'), // 'pending', 'paid', 'failed', 'refunded'
  paymentMethod: text('payment_method'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const OrderItem = pgTable('order_item', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  orderId: uuid('order_id')
    .notNull()
    .references(() => Order.id),
  foodId: uuid('food_id')
    .notNull()
    .references(() => Food.id),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  specialRequests: text('special_requests'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const FoodRating = pgTable('food_rating', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  foodId: uuid('food_id')
    .notNull()
    .references(() => Food.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id),
  orderId: uuid('order_id')
    .notNull()
    .references(() => Order.id),
  rating: integer('rating').notNull(), // 1-5
  review: text('review'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const HostRating = pgTable('host_rating', {
  id: uuid('id').primaryKey().$defaultFn(generateId),
  hostId: uuid('host_id')
    .notNull()
    .references(() => User.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id),
  orderId: uuid('order_id')
    .notNull()
    .references(() => Order.id),
  rating: integer('rating').notNull(), // 1-5
  review: text('review'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

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

// Types
export type User = typeof User.$inferSelect
export type Session = typeof Session.$inferSelect
export type HostProfile = typeof HostProfile.$inferSelect
export type Category = typeof Category.$inferSelect
export type Food = typeof Food.$inferSelect
export type Order = typeof Order.$inferSelect
export type OrderItem = typeof OrderItem.$inferSelect
export type FoodRating = typeof FoodRating.$inferSelect
export type HostRating = typeof HostRating.$inferSelect
export type Vendor = typeof Vendor.$inferSelect
