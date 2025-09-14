import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import type { Context } from 'hono'
import { CONFIG } from '../../../../config'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Coupon } from '../../../../db/schema'
import type { ListCouponsQuery, ListCouponsResponse } from '../types'

/**
 * List coupons with filtering, sorting, and pagination
 */
export async function listCoupons(c: Context): Promise<Response> {
  try {
    // Validate session
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Parse query parameters with default values
    const query = c.req.query() as unknown as ListCouponsQuery
    const {
      page = '1',
      pageSize: pageSizeParam,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
    } = query

    // Validate and parse pagination parameters
    const pageNumber = Math.max(1, Number.parseInt(page, 10)) || 1
    const pageSize = pageSizeParam
      ? Math.min(200, Math.max(1, Number.parseInt(pageSizeParam, 10)))
      : CONFIG.PAGE_SIZE
    const offset = (pageNumber - 1) * pageSize

    // Build the WHERE conditions
    const conditions = []

    // Search by coupon code or description
    if (search) {
      conditions.push(
        or(ilike(Coupon.couponCode, `%${search}%`), ilike(Coupon.description, `%${search}%`))
      )
    }

    // Filter by active status
    if (isActive !== undefined) {
      conditions.push(eq(Coupon.isActive, isActive === 'true'))
    }

    // Count total matching records
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(Coupon)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / pageSize)

    // Apply sorting
    const orderBy = []
    const allowedSortFields = [
      'id',
      'couponCode',
      'discount',
      'discountType',
      'maxDiscount',
      'isActive',
      'validFrom',
      'validTo',
      'usageLimit',
      'usageCount',
      'description',
      'createdAt',
      'updatedAt',
    ]
    const sortColumn = (
      allowedSortFields.includes(sortBy) ? Coupon[sortBy as keyof typeof Coupon] : Coupon.createdAt
    ) as any

    if (sortOrder === 'asc') {
      orderBy.push(asc(sortColumn))
    } else {
      orderBy.push(desc(sortColumn))
    }

    // Fetch paginated results
    const coupons = await db
      .select()
      .from(Coupon)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset)

    // Format the response
    const response: ListCouponsResponse = {
      data: coupons.map((coupon) => ({
        ...coupon,
        createdAt: new Date(coupon.createdAt).toISOString(),
        updatedAt: new Date(coupon.updatedAt).toISOString(),
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
    console.error('Error listing coupons:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
