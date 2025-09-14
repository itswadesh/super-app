import { and, asc, desc, ilike, or, sql } from 'drizzle-orm'
import type { Context } from 'hono'
import { CONFIG } from '../../../../config'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Vendor } from '../../../../db/schema'
import type { ListVendorsQuery, ListVendorsResponse } from '../types'

/**
 * List vendors with filtering, sorting, and pagination
 */
export async function listVendors(c: Context): Promise<Response> {
  try {
    // Validate session
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Parse query parameters with default values
    const query = c.req.query() as unknown as ListVendorsQuery
    const {
      page = '1',
      pageSize: pageSizeParam,
      search,
      sortBy = 'businessName',
      sortOrder = 'asc',
    } = query

    // console.log('DEBUG: Parsed query params:', { page, pageSizeParam, search, sortBy, sortOrder })

    // Validate and parse pagination parameters
    const pageNumber = Math.max(1, Number.parseInt(page, 10)) || 1
    const pageSize = pageSizeParam
      ? Math.min(200, Math.max(1, Number.parseInt(pageSizeParam, 10)))
      : CONFIG.PAGE_SIZE
    const offset = (pageNumber - 1) * pageSize

    // Build the WHERE conditions
    const conditions = []

    // Search by business name or bio
    if (search) {
      conditions.push(
        or(ilike(Vendor.businessName, `%${search}%`), ilike(Vendor.bio, `%${search}%`))
      )
    }

    // Count total matching records
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(Vendor)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / pageSize)

    // Apply sorting
    const orderBy = []
    const allowedSortFields = [
      'id',
      'userId',
      'fullName',
      'img',
      'email',
      'phone',
      'experience',
      'specializations',
      'kitchenEquipment',
      'availableHours',
      'deliveryRadius',
      'businessLicense',
      'businessName',
      'avatar',
      'bio',
      'qualifications',
      'achievements',
      'website',
      'twitter',
      'linkedin',
      'instagram',
      'joinedDate',
      'foodSafetyCertificate',
      'idProof',
      'address',
      'city',
      'pincode',
      'bankAccountNumber',
      'bankName',
      'ifscCode',
      'upiId',
      'status',
      'reviewedBy',
      'reviewNotes',
      'reviewedAt',
      'createdAt',
      'updatedAt',
    ]
    const sortColumn = (
      allowedSortFields.includes(sortBy)
        ? Vendor[sortBy as keyof typeof Vendor]
        : Vendor.businessName
    ) as any

    if (sortOrder === 'asc') {
      orderBy.push(asc(sortColumn))
    } else {
      orderBy.push(desc(sortColumn))
    }

    // Fetch paginated results
    const vendors = await db
      .select()
      .from(Vendor)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset)

    // Format the response
    const response: ListVendorsResponse = {
      data: vendors.map((vendor) => {
        const { qualifications, achievements, createdAt, updatedAt, ...rest } = vendor
        return {
          ...rest,
          qualifications: qualifications ? JSON.parse(qualifications) : [],
          achievements: achievements ? JSON.parse(achievements) : [],
          createdAt: new Date(createdAt).toISOString(),
          updatedAt: new Date(updatedAt).toISOString(),
        }
      }),
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
