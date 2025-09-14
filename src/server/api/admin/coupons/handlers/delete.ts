import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Coupon } from '../../../../db/schema'

/**
 * Delete a coupon by ID
 */
export async function deleteCoupon(c: Context): Promise<Response> {
  try {
    // Validate session
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get coupon ID from URL parameters
    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'Coupon ID is required' }, 400)
    }

    // Check if coupon exists
    const result = await db.select().from(Coupon).where(eq(Coupon.id, id)).limit(1)
    const existingCoupon = result[0]

    if (!existingCoupon) {
      return c.json({ error: 'Coupon not found' }, 404)
    }

    // Delete the coupon from the database
    await db.delete(Coupon).where(eq(Coupon.id, id))

    return c.json({ message: 'Coupon deleted successfully' })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
