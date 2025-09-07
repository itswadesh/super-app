// Types for database schemas
type InferSelect<T> = T extends { $inferSelect: infer U } ? U : never

// User and Session
export type User = InferSelect<typeof import('./user').User>
export type Session = InferSelect<typeof import('./user').Session>

// Category
export type Category = InferSelect<typeof import('./category').Category>

// Error Log
export type ErrorLog = InferSelect<typeof import('./error-log').ErrorLog>
export type ErrorOccurrence = InferSelect<typeof import('./error-log').ErrorOccurrence>
export type ErrorNote = InferSelect<typeof import('./error-log').ErrorNote>

// Food
export type Food = InferSelect<typeof import('./food').Food>

// Food Rating
export type FoodRating = InferSelect<typeof import('./food-rating').FoodRating>

// Order and OrderItem
export type Order = InferSelect<typeof import('./order').Order>
export type OrderItem = InferSelect<typeof import('./order-item').OrderItem>

// Host Rating
export type HostRating = InferSelect<typeof import('./host-rating').HostRating>

// Vendor
export type Vendor = InferSelect<typeof import('./vendor').Vendor>
