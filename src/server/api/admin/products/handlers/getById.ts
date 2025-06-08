import { and, eq, isNull, sql } from 'drizzle-orm';
import type { Context } from 'hono';
import { db } from '../../../../db';
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth';
import { Product, Author, Category } from '../../../../db/schema';
import type { ProductResponse } from '../types';

// Helper function to format date from SQLite timestamp to ISO string
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toISOString();
};

/**
 * Get a single product by ID with related data
 */
export async function getProductById(c: Context): Promise<Response> {
  try {
    // Validate authentication
    const sessionToken = getSessionTokenCookie(c);
    const session = await validateSessionToken(sessionToken || '');
    
    if (!session) {
      return c.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource' 
      }, 401);
    }

    // Get and validate product ID
    const id = c.req.param('id');
    if (!id) {
      return c.json({ 
        error: 'Bad Request',
        message: 'Product ID is required' 
      }, 400);
    }

    // Fetch product with related data in a single query
    const result = await db
      .select({
        // Product fields
        id: Product.id,
        title: Product.title,
        titleEnglish: Product.titleEnglish,
        slug: Product.slug,
        description: Product.description,
        categoryId: Product.categoryId,
        authorId: Product.authorId,
        difficulty: Product.difficulty,
        estimatedTime: Product.estimatedTime,
        thumbnailUrl: Product.thumbnailUrl,
        images: Product.images,
        type: Product.type,
        fileUrl: Product.fileUrl,
        language: Product.language,
        isPaid: Product.isPaid,
        isActive: Product.isActive,
        isFeatured: Product.isFeatured,
        rank: Product.rank,
        popularity: Product.popularity,
        metaKeywords: Product.metaKeywords,
        metaTitle: Product.metaTitle,
        metaDescription: Product.metaDescription,
        createdAt: Product.createdAt,
        updatedAt: Product.updatedAt,
        // Related author data
        author: {
          id: Author.id,
          name: Author.name,
          avatar: Author.avatar,
          bio: Author.bio,
        },
        // Related category data
        category: {
          id: Category.id,
          name: Category.name,
          slug: Category.slug,
          description: Category.description,
        },
      })
      .from(Product)
      .leftJoin(Author, eq(Product.authorId, Author.id))
      .leftJoin(Category, eq(Product.categoryId, Category.id))
      .where(eq(Product.id, id))
      .limit(1)
      .then(rows => rows[0]);

    // Check if product was found
    if (!result) {
      return c.json({ 
        error: 'Not Found',
        message: 'The requested product was not found' 
      }, 404);
    }


    // Parse JSON fields
    const images = result.images ? JSON.parse(result.images) : [];
    const metaKeywords = result.metaKeywords ? result.metaKeywords.split(',').map((k: string) => k.trim()) : [];

    // Map database result to response format
    const response: ProductResponse = {
      id: result.id,
      title: result.title,
      description: result.description || undefined,
      slug: result.slug,
      thumbnailUrl: result.thumbnailUrl || undefined,
      isPaid: Boolean(result.isPaid),
      hasAccess: true, // Admins always have access
      authorId: result.authorId || undefined,
      categoryId: result.categoryId || undefined,
      language: result.language || 'en',
      type: result.type as 'video' | 'note' | 'quiz' | undefined,
      fileUrl: result.fileUrl || undefined,
      difficulty: result.difficulty as 'Beginner' | 'Intermediate' | 'Advanced' | undefined,
      estimatedTime: result.estimatedTime || undefined,
      isActive: Boolean(result.isActive),
      isFeatured: Boolean(result.isFeatured),
      rank: result.rank || 0,
      popularity: result.popularity || 0,
      metaTitle: result.metaTitle || undefined,
      metaDescription: result.metaDescription || undefined,
      metaKeywords: metaKeywords.length > 0 ? metaKeywords : undefined,
      images: images.length > 0 ? images : undefined,
      createdAt: formatDate(result.createdAt as unknown as number),
      updatedAt: formatDate(result.updatedAt as unknown as number),
      // Include related data if available
      ...(result.author && { 
        author: {
          id: result.author.id,
          name: result.author.name,
          avatar: result.author.avatar || undefined,
        }
      }),
      ...(result.category && { 
        category: {
          id: result.category.id,
          name: result.category.name,
          slug: result.category.slug,
        }
      }),
    };

    return c.json(response);
  } catch (error: unknown) {
    console.error('Error fetching product:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return c.json({
      error: 'Internal Server Error',
      message: 'Failed to fetch product',
      ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
    }, 500);
  }
}

function mapToProductResponse(product: {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  thumbnailUrl: string | null;
  isPaid: boolean;
  authorId: string | null;
  categoryId: string | null;
  language: string | null;
  youtubeId: string | null;
  productUrl: string | null;
  duration: number | null;
  quality: string | null;
  views: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}): ProductResponse {
  // Helper to safely convert date to ISO string
  const toIsoString = (date: Date | string): string => 
    date instanceof Date ? date.toISOString() : new Date(date).toISOString();

  return {
    id: product.id,
    title: product.title,
    description: product.description || undefined,
    slug: product.slug,
    thumbnailUrl: product.thumbnailUrl || undefined,
    isPaid: product.isPaid,
    hasAccess: false, // Default value, adjust based on your auth logic
    authorId: product.authorId || undefined,
    categoryId: product.categoryId || undefined,
    language: product.language || undefined,
    youtubeId: product.youtubeId || undefined,
    productUrl: product.productUrl || undefined,
    duration: product.duration || undefined,
    quality: product.quality || undefined,
    views: product.views || 0,
    createdAt: toIsoString(product.createdAt),
    updatedAt: toIsoString(product.updatedAt),
  };
}
