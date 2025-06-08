import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { CONFIG } from '../../config'
import { db } from '../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../db/auth'
import { Category } from '../../db/schema'

export const categoryRoutes = new Hono()

// Helper function to build category tree
const buildCategoryTree = (categoryResults, parents: any[]) => {
  return parents.map((parent) => {
    const children = categoryResults.filter((cat) => cat.parentId === parent.id)
    return {
      ...parent,
      children: children.length > 0 ? buildCategoryTree(categoryResults, children) : [],
    }
  })
}

categoryRoutes
  .get('/', async (c: Context) => {
    const pageSize = CONFIG.PAGE_SIZE
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')
    const queryParams = c.req.query()
    const {
      page = '1',
      q = '',
      sort,
      page_size,
      class: classFilter,
      subject,
    } = queryParams

    const conditions = []
    const new_PageSize = Number(page_size)
      ? Number(page_size) > 200
        ? 200
        : Number(page_size)
      : pageSize

    // Always filter by active categories
    conditions.push(eq(Category.isActive, true))

    // Search by name
    if (q) {
      conditions.push(ilike(Category.name, `%${q}%`))
    }

    // Add metadata filters if provided
    if (classFilter) {
      // Convert classFilter to number since it's stored as a number in the database
      const classNum = Number(classFilter)
      if (!Number.isNaN(classNum)) {
        conditions.push(sql`${Category.metadata}->>'class' = ${classNum}`)
      }
    }
    if (subject) {
      conditions.push(sql`${Category.metadata}->>'subject' = ${subject}`)
    }

    const where = conditions.length > 0 ? and(...conditions) : and(eq(Category.isActive, true))

    // Log query parameters
    const params = { page, q, sort, class: classFilter, subject, page_size }
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
      }
    }

    // Log the final query
    try {
      const query = db
        .select({
          id: Category.id,
          name: Category.name,
          thumbnailUrl: Category.thumbnailUrl,
          slug: Category.slug,
          metadata: Category.metadata,
        })
        .from(Category)
        .where(where || and(eq(Category.isActive, true)))
        .limit(new_PageSize)
        .offset((+page - 1) * new_PageSize)
        .orderBy(desc(Category.name))

      const querySql = query.toSQL()

      // Function to escape SQL string literals
      const escapeString = (value: unknown): string => {
        if (value === null || value === undefined) return 'NULL'
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
        return String(value)
      }

      // Merge parameters into the SQL query
      let finalSql = querySql.sql
      const params = [...(querySql.params || [])]

      // Replace each ? with the corresponding parameter
      finalSql = finalSql.replace(/\?/g, () => {
        const param = params.shift()
        return escapeString(param)
      })

      console.log('\nExecutable SQL Query:api/categories')
      console.log(finalSql)
    } catch (error) {
      console.error('\nError generating query:', error)
    }

    console.log('===========================\n')
    const [data, count] = await Promise.all([
      db
        .select({
          id: Category.id,
          name: Category.name,
          thumbnailUrl: Category.thumbnailUrl,
          slug: Category.slug,
          metadata: Category.metadata,
        })
        .from(Category)
        .where(where)
        .limit(new_PageSize)
        .offset((+page - 1) * new_PageSize)
        .orderBy(desc(Category.name)),

      db
        .select({ count: sql<number>`count(*)` })
        .from(Category)
        .where(where)
        .then((res) => Number(res[0].count)),
    ])

    const rawResponse = { pageSize: new_PageSize, page: +page, count, data }
    // await setCache(CACHE_KEYS.categories, CACHE_QUERY_KEY, { ...rawResponse })
    return c.json(rawResponse, 200)
  })
  .get('/tree', async (c: Context) => {
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')
    const { parentId } = c.req.query()

    try {
      const categoryResults = await db.select().from(Category).where(eq(Category.isActive, true))

      // Root categories (parentId is null)
      const rootCategories = categoryResults.filter((cat) => !cat.parentId)

      // Build full category tree
      const categoryTree = buildCategoryTree(categoryResults, rootCategories)

      return c.json({
        success: true,
        data: {
          categories: categoryResults,
          categoryTree: categoryTree,
        },
      })
    } catch (error) {
      console.error('Error loading categories for admin:', error)
      return c.json(
        {
          success: false,
          error: 'Failed to load category tree',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  })
  .get('/:id', async (c: Context) => {
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')
    const slug = c.req.param('id')
    if (!slug) {
      throw { status: 400, message: 'Category ID required' }
    }
    const categories = await db
      .select()
      .from(Category)
      .where(and(eq(Category.slug, slug), eq(Category.isActive, true)))
    if (categories.length === 0) {
      throw { status: 404, message: 'Category not found' }
    }
    const category: any = categories[0]
    const subcategories = await db
      .select()
      .from(Category)
      .where(and(eq(Category.parentId, category?.id), eq(Category.isActive, true)))

    return c.json({
      ...category,
      children: subcategories,
    })
  })
