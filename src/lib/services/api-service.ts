/**
 * API service that exports all individual service modules
 */

// Export all services
export { authService } from './auth-service'
export { authorService } from './author-service'
export { categoryService } from './category-service'
export { contentService } from './content-service'
export { errorService } from './error-service'

// Export interfaces
export type { Author, ContentStats } from './author-service'
export type { Category, CategoryWithCounts, CategoryWithSubcategories } from './category-service'
export type { BaseContent, Video, Note, Quiz, PaginationParams, PaginatedResponse } from './content-service'
export type { ErrorLog, ErrorStats } from './error-service'
