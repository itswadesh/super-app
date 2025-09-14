import { error, json } from '@sveltejs/kit'
import { and, desc, eq, gte, ilike, inArray, lte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { CONFIG } from '../../config'
import { db } from '../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../db/auth'
import { Category, Product, User } from '../../db/schema'

export const productRoutes = new Hono()

productRoutes
  .get('/:id', async (c: Context) => {
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')
    const productId = c.req.param('id')
    let product: any = {}
    if (!productId) {
      throw error(400, 'Product ID required')
    }

    try {
      const products = await db
        .select({
          id: Product.id,
          title: Product.title,
          slug: Product.slug,
          thumbnailUrl: Product.thumbnail,
          categoryName: Category.name,
          categoryId: Category.id,
          categorySlug: Category.slug,
          vendorId: Product.hostId,
          vendorName: User.name,
          vendorAvatarUrl: User.avatar,
        })
        .from(Product)
        .leftJoin(Category, eq(Product.categoryId, Category.id))
        .leftJoin(User, eq(Product.hostId, User.id))
        .where(eq(Product.slug, productId))

      if (products.length === 0) {
        throw error(404, 'Product not found')
      }

      product = products[0]

      // Increment view count
      // await db
      //   .update(Product)
      //   .set({ popularity: product.popularity + 1 })
      //   .where(eq(Product.slug, productId))
      // if (product.isPaid && (!session || !session.user?.isPremium)) {
      //   return json({
      //     id: product.id,
      //     title: product.title,
      //     description: product.description,
      //     thumbnailUrl: product.thumbnailUrl,
      //     isPaid: true,
      //     hasAccess: false,
      //   })
      // }

      // Return full data
      return json({
        ...product,
        hasAccess: true,
      })
    } catch (err) {
      console.error('Error fetching product:', err)
      throw error(500, 'Failed to fetch product')
    }
  })
  .get('/', async (c: Context) => {
    const pageSize = CONFIG.PAGE_SIZE
    // const url = new URL(c.req.url);
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')
    const queryParams = c.req.query()
    const { page = '1', q = '', sort, authors, categories, page_size } = queryParams
    // console.log(page, q, sort, author_id, category_id)
    // const CACHE_QUERY_KEY = { ...queryParams }
    // let cachedData = await getCache(CACHE_KEYS.PRODUCTS, CACHE_QUERY_KEY)
    // if (cachedData) return c.json(cachedData, HttpStatusCodes.OK)

    const conditions = []
    const new_PageSize = Number(page_size)
      ? Number(page_size) > 200
        ? 200
        : Number(page_size)
      : pageSize
    conditions.push(eq(Product.isActive, true))
    if (q) {
      conditions.push(ilike(Product.title, `%${q}%`))
    }

    if (authors) {
      const authorsArray = authors.split(',')
      conditions.push(inArray(Product.hostId, authorsArray))
    }

    if (categories) {
      const categoriesArray = categories.split(',')
      console.log(categoriesArray, 'categoriesArray')
      conditions.push(inArray(Product.categoryId, categoriesArray))
    }

    const where = conditions.length > 0 ? and(...conditions) : eq(Product.isActive, true)
    const [data, count] = await Promise.all([
      db
        .select({
          id: Product.id,
          title: Product.title,
          thumbnailUrl: Product.thumbnail,
          slug: Product.slug,
          author: User,
          category: Category,
          type: Product.type,
        })
        .from(Product)
        .leftJoin(User, eq(Product.hostId, User.id))
        .leftJoin(Category, eq(Product.categoryId, Category.id))
        .where(where)
        .limit(new_PageSize)
        .offset((+page - 1) * new_PageSize)
        .orderBy(desc(Product.updatedAt)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(Product)
        .where(where)
        .then((res) => Number(res[0].count)),
    ])
    // Transform the data to include hasAccess property
    const transformedData = data.map((item) => ({
      ...item,
      hasAccess: session.user?.role === 'user',
    }))

    const rawResponse = {
      pageSize: new_PageSize,
      page: +page,
      count,
      data: transformedData,
    }
    // await setCache(CACHE_KEYS.PRODUCTS, CACHE_QUERY_KEY, { ...rawResponse })
    return c.json(rawResponse, 200)
  })
