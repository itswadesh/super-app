import type { Product, Author, Category } from '../../../db/schema';

/**
 * Base product response type
 * Maps the database Product type to our API response format
 */
export interface ProductResponse {
  // Core fields
  id: string;
  title: string;
  titleEnglish?: string;
  description?: string;
  slug: string;
  thumbnailUrl?: string;

  // Relations
  authorId?: string;
  categoryId?: string;

  // Product details
  type?: 'video' | 'note' | 'quiz';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime?: number; // in minutes
  fileUrl?: string;
  language?: string;

  // Status flags
  isPaid: boolean;
  isActive: boolean;
  isFeatured: boolean;
  hasAccess: boolean; // Computed based on user permissions

  // Metadata
  rank: number;
  popularity?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];

  // Media
  images?: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relations (expanded)
  author?: Pick<Author, 'id' | 'name' | 'avatar'>;
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
}

/**
 * Response type for listing products with pagination
 */
export interface ListProductsResponse {
  data: Omit<ProductResponse, 'hasAccess'>[];
  page: number;
  pageSize: number;
  count: number;
  totalPages: number;
}

/**
 * Request type for creating a new product
 */
export interface CreateProductRequest {
  id?: string; // For updates
  title: string;
  description?: string;
  slug?: string;
  isPaid?: boolean;
  authorId?: string;
  categoryId?: string;
  language?: string;
  youtubeId?: string;
  productUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  quality?: string;
  type: 'video' | 'note' | 'quiz';
  // Additional metadata
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
}

/**
 * Request type for updating an existing product
 */
export type UpdateProductRequest = Partial<Omit<CreateProductRequest, 'id' | 'type'>> & {
  id: string; // Required for updates
};

/**
 * Query parameters for listing products with filters
 */
export interface ListProductsQuery {
  page?: string;
  pageSize?: string;
  search?: string;
  categoryId?: string;
  authorId?: string;
  isPaid?: 'true' | 'false';
  language?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'views';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Type for product filter options
 */
export interface ProductFilterOptions {
  categories: Array<{ id: string; name: string; slug: string }>;
  languages: string[];
  authors: Array<{ id: string; name: string }>;
}
