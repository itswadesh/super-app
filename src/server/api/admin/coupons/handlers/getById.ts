import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Coupon } from '../../../../db/schema'

/**
 * Get a coupon by ID
 */
export async function getCouponById(c: Context): Promise<Response> {
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

    // Fetch the coupon
    const result = await db.select().from(Coupon).where(eq(Coupon.id, id)).limit(1)
    const coupon = result[0]

    if (!coupon) {
      return c.json({ error: 'Coupon not found' }, 404)
    }

    // Format the response
    return c.json({
      ...coupon,
      discount: parseFloat(coupon.discount),
      maxDiscount: coupon.maxDiscount ? parseFloat(coupon.maxDiscount) : null,
      createdAt: new Date(coupon.createdAt).toISOString(),
      updatedAt: new Date(coupon.updatedAt).toISOString(),
    })
  } catch (error) {
    console.error('Error fetching coupon:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
