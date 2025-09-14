import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Coupon } from '../../../../db/schema'
import type { CreateCouponRequest } from '../types'

/**
 * Create a new coupon
 */
export async function createCoupon(c: Context): Promise<Response> {
  try {
    // Validate session
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Parse and validate request body
    const data = await c.req.json<CreateCouponRequest>()

    if (!data.couponCode) {
      return c.json({ error: 'Coupon code is required' }, 400)
    }

    if (!data.discount || data.discount <= 0) {
      return c.json({ error: 'Valid discount amount is required' }, 400)
    }

    if (!['percentage', 'fixed'].includes(data.discountType)) {
      return c.json({ error: 'Discount type must be either "percentage" or "fixed"' }, 400)
    }

    // Check if coupon with the same code already exists
    const result = await db
      .select()
      .from(Coupon)
      .where(eq(Coupon.couponCode, data.couponCode))
      .limit(1)
    const existingCoupon = result[0]

    if (existingCoupon) {
      return c.json({ error: 'A coupon with this code already exists' }, 409)
    }

    // Create the new coupon
    const now = new Date()
    const newCoupon = {
      id: crypto.randomUUID(),
      couponCode: data.couponCode,
      discount: data.discount.toString(),
      discountType: data.discountType,
      maxDiscount: data.maxDiscount?.toString() || null,
      isActive: data.isActive ?? true,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validTo: data.validTo ? new Date(data.validTo) : null,
      usageLimit: data.usageLimit || null,
      description: data.description || null,
      createdAt: now,
      updatedAt: now,
    }

    // Insert into database
    await db.insert(Coupon).values(newCoupon)

    // Return the created coupon
    return c.json(
      {
        ...newCoupon,
        discount: parseFloat(newCoupon.discount),
        maxDiscount: newCoupon.maxDiscount ? parseFloat(newCoupon.maxDiscount) : null,
        createdAt: newCoupon.createdAt.toISOString(),
        updatedAt: newCoupon.updatedAt.toISOString(),
      },
      201
    )
  } catch (error) {
    console.error('Error creating coupon:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
