import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Vendor } from '../../../../db/schema'
import type { VendorResponse } from '../types'

/**
 * Get a vendor by ID
 */
export async function getVendorById(c: Context): Promise<Response> {
  try {
    // Validate session
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get vendor ID from URL parameters
    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'Vendor ID is required' }, 400)
    }

    // Fetch the vendor from the database
    const vendor = await db.select().from(Vendor).where(eq(Vendor.id, id)).get()

    if (!vendor) {
      return c.json({ error: 'Vendor not found' }, 404)
    }

    // Format the response
    const response: VendorResponse = {
      ...vendor,
      qualifications: vendor.qualifications ? JSON.parse(vendor.qualifications) : [],
      achievements: vendor.achievements ? JSON.parse(vendor.achievements) : [],
      createdAt: new Date(vendor.createdAt).toISOString(),
      updatedAt: new Date(vendor.updatedAt).toISOString(),
    }

    return c.json(response)
  } catch (error) {
    console.error('Error fetching vendor:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
