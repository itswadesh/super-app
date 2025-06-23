import { and, asc, desc, ilike, or, sql } from 'drizzle-orm'
import type { Context } from 'hono'
import { CONFIG } from '../../../../config'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Author } from '../../../../db/schema'
import type { ListAuthorsQuery, ListAuthorsResponse } from '../types'

/**
 * List authors with filtering, sorting, and pagination
 */
export async function listAuthors(c: Context): Promise<Response> {
  try {
    // Validate session
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Parse query parameters with default values
    const query = c.req.query() as unknown as ListAuthorsQuery
    const {
      page = '1',
      pageSize: pageSizeParam,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query

    // Validate and parse pagination parameters
    const pageNumber = Math.max(1, Number.parseInt(page, 10)) || 1
    const pageSize = pageSizeParam
      ? Math.min(200, Math.max(1, Number.parseInt(pageSizeParam, 10)))
      : CONFIG.PAGE_SIZE
    const offset = (pageNumber - 1) * pageSize

    // Build the WHERE conditions
    const conditions = []

    // Search by name or bio
    if (search) {
      conditions.push(or(ilike(Author.name, `%${search}%`), ilike(Author.bio, `%${search}%`)))
    }

    // Count total matching records
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(Author)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / pageSize)

    // Apply sorting
    const orderBy = []
    const sortColumn = sortBy in Author ? Author[sortBy as keyof typeof Author] : Author.name

    if (sortOrder === 'asc') {
      orderBy.push(asc(sortColumn))
    } else {
      orderBy.push(desc(sortColumn))
    }

    // Fetch paginated results
    const authors = await db
      .select()
      .from(Author)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset)

    // Format the response
    const response: ListAuthorsResponse = {
      data: authors.map((author) => ({
        ...author,
        qualifications: author.qualifications ? JSON.parse(author.qualifications) : [],
        achievements: author.achievements ? JSON.parse(author.achievements) : [],
        createdAt: new Date(author.createdAt).toISOString(),
        updatedAt: new Date(author.updatedAt).toISOString(),
      })),
      pagination: {
        page: pageNumber,
        pageSize,
        total,
        totalPages,
      },
    }

    return c.json(response)
  } catch (error) {
    console.error('Error listing authors:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
