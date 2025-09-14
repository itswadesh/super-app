import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Vendor } from '../../../../db/schema'
import type { UpdateVendorRequest } from '../types'

/**
 * Update a vendor by ID
 */
export async function updateVendor(c: Context): Promise<Response> {
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

    // Parse and validate request body
    const data = await c.req.json<UpdateVendorRequest>()

    // Check if vendor exists
    const result = await db.select().from(Vendor).where(eq(Vendor.id, id)).limit(1)
    const existingVendor = result[0]

    if (!existingVendor) {
      return c.json({ error: 'Vendor not found' }, 404)
    }

    // Check if another vendor with the same name already exists
    if (data.businessName && data.businessName !== existingVendor.businessName) {
      const duplicateResult = await db
        .select()
        .from(Vendor)
        .where(eq(Vendor.businessName, data.businessName))
        .limit(1)
      const duplicateVendor = duplicateResult[0]

      if (duplicateVendor) {
        return c.json({ error: 'A vendor with this name already exists' }, 409)
      }
    }

    // Prepare the update data
    const now = new Date()
    const updateData = {
      businessName:
        data.businessName !== undefined ? data.businessName : existingVendor.businessName,
      updatedAt: now,
    }

    // Update the vendor in the database
    await db.update(Vendor).set(updateData).where(eq(Vendor.id, id))

    // Fetch the updated vendor
    const updatedResult = await db.select().from(Vendor).where(eq(Vendor.id, id)).limit(1)
    const updatedVendor = updatedResult[0]

    // Format the response
    return c.json({
      ...updatedVendor,
      qualifications: updatedVendor.qualifications ? JSON.parse(updatedVendor.qualifications) : [],
      achievements: updatedVendor.achievements ? JSON.parse(updatedVendor.achievements) : [],
      createdAt: new Date(updatedVendor.createdAt).toISOString(),
      updatedAt: new Date(updatedVendor.updatedAt).toISOString(),
    })
  } catch (error) {
    console.error('Error updating author:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
