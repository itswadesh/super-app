import { and, desc, eq, ilike, inArray, sql, asc, isNull, or } from 'drizzle-orm'
import type { Context } from 'hono'
import { CONFIG } from '../../../../config'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Product, Author, Category } from '../../../../db/schema'
import type { ListProductsQuery, ListProductsResponse, ProductResponse } from '../types'

/**
 * List products with filtering, sorting, and pagination
 */
export async function listProducts(c: Context): Promise<Response> {
  try {
    // Validate session
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Parse query parameters with default values
    const query = c.req.query() as unknown as ListProductsQuery
    const {
      page = '1',
      pageSize: pageSizeParam,
      search,
      categoryId,
      authorId,
      isPaid,
      language,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = query

    // Validate and parse pagination parameters
    const pageNumber = Math.max(1, Number.parseInt(page, 10)) || 1
    const pageSize = pageSizeParam
      ? Math.min(200, Math.max(1, Number.parseInt(pageSizeParam, 10)))
      : CONFIG.PAGE_SIZE
    const offset = (pageNumber - 1) * pageSize

    // Build the WHERE conditions
    const conditions = []

    // Search by title or description
    if (search) {
      conditions.push(
        or(ilike(Product.title, `%${search}%`), ilike(Product.description, `%${search}%`))
      )
    }

    // Filter by category
    if (categoryId) {
      conditions.push(eq(Product.categoryId, categoryId))
    }

    // Filter by author
    if (authorId) {
      conditions.push(eq(Product.authorId, authorId))
    }

    // Filter by paid status
    if (isPaid === 'true' || isPaid === 'false') {
      conditions.push(eq(Product.isPaid, isPaid === 'true'))
    }

    // Filter by language
    if (language) {
      conditions.push(eq(Product.language, language))
    }

    // Only include active products (if your schema has such a field)
    // conditions.push(eq(Product.isActive, true));

    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Build order by clause
    const orderBy = []
    const sortField =
      sortBy in Product ? Product[sortBy as keyof typeof Product] : Product.updatedAt

    if (sortOrder === 'asc') {
      orderBy.push(asc(sortField))
    } else {
      orderBy.push(desc(sortField))
    }
    // Add a secondary sort to ensure consistent ordering
    orderBy.push(asc(Product.id))

    // Get the count and data in parallel for better performance
    const [data, countResult] = await Promise.all([
      // Fetch paginated data with related author and category
      db
        .select({
          id: Product.id,
          title: Product.title,
          description: Product.description,
          slug: Product.slug,
          thumbnailUrl: Product.thumbnailUrl,
          isPaid: sql<boolean>`COALESCE(${Product.isPaid}, false)`,
          authorId: Product.authorId,
          categoryId: Product.categoryId,
          language: Product.language,
          youtubeId: Product.youtubeId,
          productUrl: Product.productUrl,
          duration: Product.duration,
          quality: Product.quality,
          views: sql<number>`COALESCE(${Product.views}, 0)`,
          createdAt: sql<string>`strftime('%Y-%m-%dT%H:%M:%fZ', ${Product.createdAt}/1000, 'unixepoch')`,
          updatedAt: sql<string>`strftime('%Y-%m-%dT%H:%M:%fZ', ${Product.updatedAt}/1000, 'unixepoch')`,
          // Include related author data
          author: {
            id: Author.id,
            name: Author.name,
            avatar: Author.avatar,
          },
          // Include related category data
          category: {
            id: Category.id,
            name: Category.name,
            slug: Category.slug,
          },
        })
        .from(Product)
        .leftJoin(Author, eq(Product.authorId, Author.id))
        .leftJoin(Category, eq(Product.categoryId, Category.id))
        .where(where)
        .limit(pageSize)
        .offset(offset)
        .orderBy(...orderBy),

      // Get total count for pagination
      db
        .select({ count: sql<number>`count(*)` })
        .from(Product)
        .where(where)
        .then((res) => Number(res[0].count)),
    ])

    // Map database results to response format
    const mappedData: ProductResponse[] = data.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || undefined,
      slug: item.slug,
      thumbnailUrl: item.thumbnailUrl || undefined,
      isPaid: item.isPaid,
      hasAccess: false, // Default value, adjust based on your auth logic
      authorId: item.authorId || undefined,
      categoryId: item.categoryId || undefined,
      language: item.language || undefined,
      youtubeId: item.youtubeId || undefined,
      productUrl: item.productUrl || undefined,
      duration: item.duration || undefined,
      quality: item.quality || undefined,
      views: item.views || 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      // Include related data if available
      ...(item.author && { author: item.author }),
      ...(item.category && { category: item.category }),
    }))

    // Prepare pagination response
    const totalPages = Math.ceil(countResult / pageSize)
    const response: ListProductsResponse = {
      data: mappedData,
      page: pageNumber,
      pageSize,
      count: countResult,
      totalPages,
    }

    return c.json(response)
  } catch (error: unknown) {
    console.error('Error listing products:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json(
      {
        error: 'Failed to list products',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      500
    )
  }
}

/**
 * Helper function to safely parse boolean query parameters
 */
function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}
