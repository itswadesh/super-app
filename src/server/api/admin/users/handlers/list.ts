import type { Context } from 'hono'
import { and, eq, like, sql } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { User } from '../../../../db/schema'
import { db } from '../../../../db'
import type { ListUsersQuery, ListUsersResponse } from '../types'

type UserWithTimestamps = InferSelectModel<typeof User> & {
  createdAt: Date | null
  updatedAt: Date | null
}

export async function listUsers(c: Context) {
  try {
    const query = c.req.query() as unknown as ListUsersQuery

    // Pagination
    const page = query.page ? Number.parseInt(query.page, 10) : 1
    const pageSize = query.pageSize ? Number.parseInt(query.pageSize, 10) : 10
    const offset = (page - 1) * pageSize

    // Build where clause
    const whereClause = []

    if (query.search) {
      whereClause.push(like(User.phone, `%${query.search}%`))
    }

    if (query.role) {
      whereClause.push(eq(User.role, query.role as 'user' | 'admin'))
    }

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(User)
      .where(whereClause.length > 0 ? and(...whereClause) : undefined)
      .then((result: { count: number }[]) => result[0]?.count || 0)

    // Get paginated users
    const users = (await db
      .select()
      .from(User)
      .where(whereClause.length > 0 ? and(...whereClause) : undefined)
      .limit(pageSize)
      .offset(offset)
      .all()) as UserWithTimestamps[]

    // Format response
    const formattedUsers = users.map((user) => ({
      ...user,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    }))

    const response: ListUsersResponse = {
      data: formattedUsers,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    }

    return c.json(response)
  } catch (error) {
    console.error('Error listing users:', error)
    return c.json({ error: 'Failed to list users' }, 500)
  }
}
