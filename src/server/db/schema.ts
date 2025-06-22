import { integer, numeric, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Helper function to generate unique IDs
const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`

export const User = sqliteTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('user')),
  age: integer('age'),
  phone: text('phone').notNull().unique(),
  otp: text('otp').notNull(),
  role: text('role').default('user'), // 'user', 'admin'
})

export const Session = sqliteTable('session', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('sess')),
  userId: text('user_id')
    .notNull()
    .references(() => User.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
})

export type Session = typeof Session.$inferSelect

export type User = typeof User.$inferSelect

// Authors table
export const Author = sqliteTable('authors', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('author')),
  name: text('name').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  qualifications: text('qualifications'), // Stored as JSON string
  achievements: text('achievements'), // Stored as JSON string
  joinedDate: integer('joined_date', { mode: 'timestamp' }),
  website: text('website'),
  twitter: text('twitter'),
  linkedin: text('linkedin'),
  instagram: text('instagram'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Categories table
export const Category = sqliteTable('categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('category')),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  // For hierarchical structure (parent-child relationship)
  parentId: text('parent_id'),
  type: text('type').default('topic'),
  metadata: text('metadata', { mode: 'json' }), // This tells Drizzle to handle JSON serialization
  // For language support
  language: text('language').default('en'), // 'en', 'hi', 'or', 'bn'
  // For UI ordering
  rank: integer('rank').default(0),
  count: integer('count').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  // createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  // updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const ProductCategory = sqliteTable('product_categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('prod_cat')),
  productId: text('product_id')
    .notNull()
    .references(() => Product.id),
  categoryId: text('category_id')
    .notNull()
    .references(() => Category.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Notes table
// export const Note = sqliteTable('notes', {
//   id: text('id')
//     .primaryKey()
//     .$defaultFn(() => generateId('note')),
//   // title: text('title').notNull(),
//   // slug: text('slug').notNull().unique(),
//   // description: text('description'),
//   content: text('content'),
//   // categoryId: text('category_id').references(() => Category.id),
//   // authorId: text('author_id').references(() => Author.id),
//   fileType: text('file_type'),
//   fileSize: text('file_size'),
//   fileUrl: text('file_url'), // S3 URL for the note file
//   // thumbnailUrl: text('thumbnail_url'),
//   language: text('language').default('en'), // 'en' (English), 'hi' (Hindi), 'or' (Odia), 'bn' (Bengali)
//   // isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
//   // rank: integer('rank').default(0),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
// })

// Videos table
// export const Video = sqliteTable('videos', {
//   id: text('id')
//     .primaryKey()
//     .$defaultFn(() => generateId('video')),
//   title: text('title').notNull(),
//   slug: text('slug').notNull().unique(),
//   description: text('description'),
//   categoryId: text('category_id').references(() => Category.id),
//   authorId: text('author_id').references(() => Author.id),
//   duration: text('duration'), // Format: '10:30' or '1:25:00'
//   quality: text('quality'), // e.g., '720p', '1080p'
//   views: integer('views').default(0),
//   videoUrl: text('video_url'), // YouTube video URL or ID
//   youtubeId: text('youtube_id'), // YouTube video ID for embedding
//   thumbnailUrl: text('thumbnail_url'),
//   language: text('language').default('en'), // 'en' (English), 'hi' (Hindi), 'or' (Odia), 'bn' (Bengali)
//   isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
//   rank: integer('rank').default(0),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
//   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
// })

// Quizzes table
export const Quiz = sqliteTable('quizzes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('quiz')),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  instructions: text('instructions'),
  categoryId: text('category_id').references(() => Category.id),
  authorId: text('author_id').references(() => Author.id),
  // difficulty: text('difficulty'), // 'Beginner', 'Intermediate', 'Advanced'
  duration: integer('duration'), // in minutes
  thumbnailUrl: text('thumbnail_url'),
  marking: integer('marking', { mode: 'boolean' }).default(false),
  negativeMarking: integer('negative_marking', { mode: 'boolean' }).default(false),
  totalMarks: integer('total_marks').default(0),
  cutOffMarks: integer('cut_off_marks').default(0),
  // language: text('language').default('en'), // 'en' (English), 'hi' (Hindi), 'or' (Odia), 'bn' (Bengali)
  isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
  rank: integer('rank').default(0),
  productId: text('product_id').references(() => Product.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Quiz questions table
export const QuizQuestion = sqliteTable('quiz_questions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('qq')),
  quizId: text('quiz_id')
    .notNull()
    .references(() => Quiz.id),
  sectionId: text('section_id'),
  question: text('question').notNull(),
  correctAnswerIndex: integer('correct_answer_index').notNull(),
  explanation: text('explanation'),
  rank: integer('rank').default(0),
})

// Quiz answers table
export const QuizAnswer = sqliteTable('quiz_answers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('qa')),
  questionId: text('question_id')
    .notNull()
    .references(() => QuizQuestion.id),
  answerText: text('answer_text').notNull(),
  rank: integer('rank').default(0),
})

// Quiz attempts table to track user's quiz attempts
export const QuizAttempt = sqliteTable('quiz_attempts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('qatt')),
  userId: text('user_id')
    .notNull()
    .references(() => User.id),
  quizId: text('quiz_id')
    .notNull()
    .references(() => Quiz.id),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  score: integer('score'),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers'),
  rank: integer('rank'), // To store the user's rank for this quiz attempt
  timeSpent: integer('time_spent'), // In seconds
  status: text('status').default('in_progress'), // 'in_progress', 'completed', 'abandoned'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Quiz attempt answers to store user's answers for each question
export const QuizAttemptAnswer = sqliteTable('quiz_attempt_answers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('qaa')),
  attemptId: text('attempt_id')
    .notNull()
    .references(() => QuizAttempt.id),
  questionId: text('question_id')
    .notNull()
    .references(() => QuizQuestion.id),
  selectedAnswerIndex: integer('selected_answer_index'), // The index of the answer selected by user
  isCorrect: integer('is_correct', { mode: 'boolean' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const Reports = sqliteTable('reports', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('rep')),
  name: text('name').notNull(),
  query: text('query').notNull(),
  description: text('description'),
  store_id: text('store_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const Invoice = sqliteTable('invoices', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('inv')),
  invoice_no: text('invoice_no').notNull(),
  tax_type: text('tax_type'),
  report_status: text('report_status'),
  order_no: text('order_no').notNull(),
  store_id: text('store_id').notNull(),
  order_id: text('order_id').notNull(),
  // vendor: jsonb('vendor'),
  total_tax_amount: numeric('total_tax_amount'),
  // vendor_address: jsonb('vendor_address'),
  ix: numeric('ix'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  comment: text('comment'),
  invoice_id: text('invoice_id'),
  isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
  invoice_urls: text('invoice_urls'),
  status: text('status').default('created'),
  invoice_type: text('invoice_type').default('invoice'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const InvoiceItem = sqliteTable('invoice_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('ii')),
  store_id: text('store_id').notNull(),
  hsn: text('hsn'),
  name: text('name').notNull(),
  order_item_id: text('order_item_id').notNull(),
  item_order_no: text('item_order_no').notNull(),
  order_no: text('order_no').notNull(),
  pid: text('pid').notNull(),
  invoice_no: text('invoice_no').notNull(),
  qty: integer('qty').notNull(),
  mrp: integer('mrp').notNull(),
  price: integer('price').notNull(),
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax'),
  total: integer('total'),
  sku: text('sku').notNull(),
  slug: text('slug'),
  status: text('status'),
  sgst_rate: integer('sgst_rate'),
  igst_rate: integer('igst_rate'),
  cgst_rate: integer('cgst_rate'),
  utgst_rate: integer('utgst_rate'),
  unit_price: integer('unit_price'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const Plan = sqliteTable('plans', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('plan')),
  name: text('name').notNull(),
  validity: integer('validity'), // Number of days
  price: integer('price'),
  mrp: integer('mrp'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  description: text('description'),
  features: text('features', { mode: 'json' }),
  // extratext: jsonb('extratext'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
})

export const Order = sqliteTable('orders', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('order')),
  customerId: integer('customer_id'),
  planId: integer('plan_id').notNull(),
  paymentOrderId: text('payment_order_id'),
  totalAmount: integer('total_amount').notNull(),
  amountPaid: integer('amount_paid'),
  pgName: text('pg_name'),
  paymentReferenceId: text('payment_reference_id'),
  orderNo: text('order_no'),
  status: text('status'),
  paymentStatus: text('payment_status'),
  comment: text('comment'),
  paymentRemark: text('payment_remark'),
  isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
  phone: text('phone'),
  email: text('email'),
  couponCode: text('coupon_code'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  validFrom: integer('valid_from', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  validTo: integer('valid_to', { mode: 'timestamp' }),
})

export const Coupon = sqliteTable('coupons', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('coup')),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  couponCode: text('coupon_code'),
  discount: integer('discount'),
  discountType: text('discount_type').default('percentage'),
  maxDiscount: integer('max_discount'),
  validFrom: integer('valid_from', { mode: 'timestamp' }),
  validTo: integer('valid_to', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

// Error logging table
export const ErrorLog = sqliteTable('error_logs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('err')),
  fingerprint: text('fingerprint').notNull(), // Unique identifier for the error (source + message)
  source: text('source').notNull(), // Where the error happened (API endpoint, component, etc.)
  message: text('message').notNull(), // Error message
  details: text('details'), // Additional error details or stack trace (optional)
  category: text('category').default('general'), // Category of error (e.g., 'frontend', 'backend', 'api')
  occurrences: integer('occurrences').notNull().default(1), // How many times this error has happened
  firstSeen: integer('first_seen', { mode: 'timestamp' }).notNull(), // When the error was first logged
  lastSeen: integer('last_seen', { mode: 'timestamp' }).notNull(), // When the error was most recently seen
  isViewed: integer('is_viewed', { mode: 'boolean' }).default(false), // Whether the error has been viewed by an admin
  isIgnored: integer('is_ignored', { mode: 'boolean' }).default(false), // Whether the error should be ignored (won't show in primary list)
  ignoredReason: text('ignored_reason'), // Optional reason for ignoring this error
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const Product = sqliteTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('prod')),
  title: text('title').notNull(),
  titleEnglish: text('title_english'),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  longDescription: text('long_description'),
  categoryId: text('category_id').references(() => Category.id),
  authorId: text('author_id').references(() => Author.id),
  difficulty: text('difficulty'), // 'Beginner', 'Intermediate', 'Advanced'
  // estimatedTime: integer('estimated_time'), // in minutes
  thumbnailUrl: text('thumbnail_url'),
  images: text('images'),
  type: text('type'),
  // fileUrl: text('file_url'),
  language: text('language').default('en'), // 'en' (English), 'hi' (Hindi), 'or' (Odia), 'bn' (Bengali)
  isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  rank: integer('rank').default(0),
  popularity: integer('popularity'),
  metaKeywords: text('meta_keywords'),
  metaTitle: text('meta_title'),
  metaDescription: text('description'),
  metaData: text('meta_data', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const ProductRating = sqliteTable('product_ratings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('prod_rating')),
  productId: text('product_id')
    .notNull()
    .references(() => Product.id),
  userId: text('user_id')
    .notNull()
    .references(() => User.id),
  rating: integer('rating').notNull(), // Rating out of 5
  // review: text('review'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const ProductTag = sqliteTable('product_tags', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('prod_tag')),
  productId: text('product_id')
    .notNull()
    .references(() => Product.id),
  tag: text('tag').notNull(), // e.g., 'AI', 'Web Development', 'Data Science'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Types
export type Author = typeof Author.$inferSelect
export type Category = typeof Category.$inferSelect
export type ProductCategory = typeof ProductCategory.$inferSelect
// export type Note = typeof Note.$inferSelect
// export type Video = typeof Video.$inferSelect
export type Quiz = typeof Quiz.$inferSelect
export type QuizQuestion = typeof QuizQuestion.$inferSelect
export type QuizAnswer = typeof QuizAnswer.$inferSelect
export type QuizAttempt = typeof QuizAttempt.$inferSelect
export type QuizAttemptAnswer = typeof QuizAttemptAnswer.$inferSelect
export type Product = typeof Product.$inferSelect
export type ProductRating = typeof ProductRating.$inferSelect
export type ProductTag = typeof ProductTag.$inferSelect
export type ErrorLog = typeof ErrorLog.$inferSelect

// Bus Booking Schema
export const BusRoute = sqliteTable('bus_routes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('bus_route')),
  source: text('source').notNull(),
  destination: text('destination').notNull(),
  distance: integer('distance'), // in km
  estimatedDuration: text('estimated_duration'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const Bus = sqliteTable('buses', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('bus')),
  routeId: text('route_id')
    .notNull()
    .references(() => BusRoute.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'sleeper', 'semi-sleeper', 'seater'
  totalSeats: integer('total_seats').notNull(),
  availableSeats: integer('available_seats').notNull(),
  departureTime: text('departure_time').notNull(),
  arrivalTime: text('arrival_time').notNull(),
  price: numeric('price').notNull(),
  amenities: text('amenities', { mode: 'json' }), // JSON array of amenities
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const BusBooking = sqliteTable('bus_bookings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateId('bus_booking')),
  userId: text('user_id')
    .notNull()
    .references(() => User.id),
  busId: text('bus_id')
    .notNull()
    .references(() => Bus.id),
  bookingReference: text('booking_reference').notNull().unique(),
  passengerName: text('passenger_name').notNull(),
  passengerEmail: text('passenger_email').notNull(),
  passengerPhone: text('passenger_phone').notNull(),
  totalSeats: integer('total_seats').notNull(),
  totalAmount: numeric('total_amount').notNull(),
  bookingDate: integer('booking_date', { mode: 'timestamp' }).notNull(),
  travelDate: integer('travel_date', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('confirmed'), // 'confirmed', 'cancelled', 'completed'
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending', 'paid', 'failed'
  paymentId: text('payment_id'),
  source: text('source').notNull(),
  destination: text('destination').notNull(),
  seatNumbers: text('seat_numbers', { mode: 'json' }), // JSON array of seat numbers
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Types
export type BusRoute = typeof BusRoute.$inferSelect
export type Bus = typeof Bus.$inferSelect
export type BusBooking = typeof BusBooking.$inferSelect
