import { and, eq, isNull, or, notInArray } from 'drizzle-orm'
import type { Context } from 'hono'
import { nanoid } from 'nanoid'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Author, Category, Product } from '../../../../db/schema'
import type { CreateProductRequest, ProductResponse, UpdateProductRequest } from '../types'
import { generateUniqueSlug } from '../../../../../lib/utils/string-utils'

/**
 * Create or update a product
 */
export async function createProduct(c: Context): Promise<Response> {
  try {
    // Check authentication
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    if (!session || session.user?.role !== 'admin') {
      return c.json({ error: 'Unauthorized. Only admin users can manage products.' }, 403)
    }

    // Parse and validate request body
    const data = (await c.req.json()) as CreateProductRequest | UpdateProductRequest
    const isUpdate = 'id' in data && data.id !== 'new'

    // Extract common fields
    const {
      id = 'new',
      title = '',
      description,
      slug: inputSlug,
      isPaid = false,
      categoryId,
      authorId,
      language = 'en',
      youtubeId,
      productUrl,
      thumbnailUrl,
      duration,
      quality,
      type,
      metaTitle,
      metaDescription,
      tags = [],
    } = data

    // Validate required fields
    if (!title.trim()) {
      return c.json({ error: 'Title is required' }, 400)
    }

    if (!isUpdate && !type) {
      return c.json({ error: 'Product type is required' }, 400)
    }

    // Validate author exists if provided
    if (authorId) {
      const author = await db.query.Author.findFirst({
        where: and(eq(Author.id, authorId), isNull(Author.deletedAt)),
      })
      if (!author) {
        return c.json({ error: 'Author not found' }, 404)
      }
    }

    // Validate category exists if provided
    if (categoryId) {
      const category = await db.query.Category.findFirst({
        where: and(eq(Category.id, categoryId), isNull(Category.deletedAt)),
      })
      if (!category) {
        return c.json({ error: 'Category not found' }, 404)
      }
    }

    // Generate a unique slug
    const baseSlug = inputSlug || title

    // Get all existing slugs from the database (excluding current product if updating)
    const existingSlugs = (
      await db
        .select({ slug: Product.slug })
        .from(Product)
        .where(isUpdate ? notInArray(Product.id, [id].filter(Boolean)) : undefined)
    ).map(({ slug }) => slug)

    // Generate a unique slug
    const uniqueSlug = await generateUniqueSlug(baseSlug, existingSlugs, {
      lower: true,
      strict: true,
    })

    const now = new Date()
    const productId = isUpdate ? id : nanoid()

    // Prepare the base values
    const baseValues = {
      title,
      description: description || null,
      slug: uniqueSlug,
      isPaid,
      type: type || null,
      categoryId: categoryId || null,
      authorId: authorId || null,
      language: language || 'en',
      youtubeId: youtubeId || null,
      productUrl: productUrl || null,
      thumbnailUrl: thumbnailUrl || null,
      duration: duration || null,
      quality: quality || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      tags: tags || [],
      updatedAt: now,
    }
    console.log(baseValues, 'cvvvvvv')
    let product: typeof Product.$inferSelect

    if (!isUpdate) {
      // Create new product
      const result = await db
        .insert(Product)
        .values({
          ...baseValues,
          id: productId,
          createdAt: now,
        })
        .returning()
      product = result[0]
    } else {
      // Update existing product
      const result = await db.update(Product).set(baseValues).where(eq(Product.id, id)).returning()
      product = result[0]
    }
    return c.json(
      {
        success: true,
        message: 'Product created successfully',
        product,
      },
      201
    )
  } catch (error: unknown) {
    console.error('Error creating product:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: 'Failed to create product', details: errorMessage }, 500)
  }
}

// function mapToProductResponse(product: {
//   id: string;
//   title: string;
//   description: string | null;
//   slug: string;
//   thumbnailUrl: string | null;
//   isPaid: boolean;
//   authorId: string | null;
//   categoryId: string | null;
//   language: string | null;
//   youtubeId: string | null;
//   productUrl: string | null;
//   duration: number | null;
//   quality: string | null;
//   views: number | null;
//   createdAt: Date | string;
//   updatedAt: Date | string;
// }): ProductResponse {
//   // Helper to safely convert date to ISO string
//   const toIsoString = (date: Date | string): string =>
//     date instanceof Date ? date.toISOString() : new Date(date).toISOString();

//   return {
//     id: product.id,
//     title: product.title,
//     description: product.description || undefined,
//     slug: product.slug,
//     thumbnailUrl: product.thumbnailUrl || undefined,
//     isPaid: product.isPaid,
//     hasAccess: false, // Default value, adjust based on your auth logic
//     authorId: product.authorId || undefined,
//     categoryId: product.categoryId || undefined,
//     language: product.language || undefined,
//     youtubeId: product.youtubeId || undefined,
//     productUrl: product.productUrl || undefined,
//     duration: product.duration || undefined,
//     quality: product.quality || undefined,
//     views: product.views || 0,
//     createdAt: toIsoString(product.createdAt),
//     updatedAt: toIsoString(product.updatedAt),
//   };
// }
