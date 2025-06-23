import { and, desc, eq, ilike, sql, or } from 'drizzle-orm'
import type { Context } from 'hono'
import { Category } from '../../../../../server/db/schema'
import { getSessionTokenCookie, validateSessionToken } from '../../../../../server/db/auth'
import { getUniqueMetadataValues, parseMetadataFilter } from '../utils/metadata'
import type { ListCategoriesQuery, ListCategoriesResponse, CategoryResponse } from '../types'
import { db } from '../../../../db'
import { CONFIG } from '../../../../config'

interface CategoryWithMetadata extends Omit<Category, 'metadata'> {
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export async function listCategories(c: Context): Promise<Response> {
  const pageSize = 2000
  const sessionToken = getSessionTokenCookie(c)
  const session = await validateSessionToken(sessionToken || '')
  const queryParams = c.req.query()
  const { page = '1', q = '', sort, page_size, class: classFilter, subject } = queryParams

  const conditions = []
  const new_PageSize = Number(page_size)
    ? Number(page_size) > 2000
      ? 2000
      : Number(page_size)
    : pageSize

  // Always filter by active categories
  // conditions.push(eq(Category.isActive, true))

  // Search by name
  if (q) {
    conditions.push(ilike(Category.name, `%${q}%`))
  }

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

  const where = conditions.length > 0 ? and(...conditions) : undefined

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
        parentId: Category.parentId,
      })
      .from(Category)
      .where(where)
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

    console.log('\nExecutable SQL Query:api/admin/categories')
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
        parentId: Category.parentId,
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
}
