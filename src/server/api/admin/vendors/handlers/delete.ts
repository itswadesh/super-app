import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Vendor } from '../../../../db/schema'

/**
 * Delete a vendor by ID
 */
export async function deleteVendor(c: Context): Promise<Response> {
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

    // Check if vendor exists
    const result = await db.select().from(Vendor).where(eq(Vendor.id, id)).limit(1)
    const existingVendor = result[0]

    if (!existingVendor) {
      return c.json({ error: 'Vendor not found' }, 404)
    }

    // TODO: Check if vendor has any associated content before deleting
    // For now, we'll proceed with deletion

    // Delete the vendor from the database
    await db.delete(Vendor).where(eq(Vendor.id, id))

    return c.json({ message: 'Vendor deleted successfully' })
  } catch (error) {
    console.error('Error deleting author:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
