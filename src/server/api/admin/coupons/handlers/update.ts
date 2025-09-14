import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Coupon } from '../../../../db/schema'
import type { UpdateCouponRequest } from '../types'

/**
 * Update a coupon by ID
 */
export async function updateCoupon(c: Context): Promise<Response> {
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

    // Parse and validate request body
    const data = await c.req.json<UpdateCouponRequest>()

    // Check if coupon exists
    const result = await db.select().from(Coupon).where(eq(Coupon.id, id)).limit(1)
    const existingCoupon = result[0]

    if (!existingCoupon) {
      return c.json({ error: 'Coupon not found' }, 404)
    }

    // Check if another coupon with the same code already exists
    if (data.couponCode && data.couponCode !== existingCoupon.couponCode) {
      const duplicateResult = await db
        .select()
        .from(Coupon)
        .where(eq(Coupon.couponCode, data.couponCode))
        .limit(1)
      const duplicateCoupon = duplicateResult[0]

      if (duplicateCoupon) {
        return c.json({ error: 'A coupon with this code already exists' }, 409)
      }
    }

    // Prepare the update data
    const now = new Date()
    const updateData: any = {
      updatedAt: now,
    }

    if (data.couponCode !== undefined) updateData.couponCode = data.couponCode
    if (data.discount !== undefined) updateData.discount = data.discount.toString()
    if (data.discountType !== undefined) updateData.discountType = data.discountType
    if (data.maxDiscount !== undefined)
      updateData.maxDiscount = data.maxDiscount?.toString() || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.validFrom !== undefined)
      updateData.validFrom = data.validFrom ? new Date(data.validFrom) : null
    if (data.validTo !== undefined)
      updateData.validTo = data.validTo ? new Date(data.validTo) : null
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit
    if (data.description !== undefined) updateData.description = data.description

    // Update the coupon in the database
    await db.update(Coupon).set(updateData).where(eq(Coupon.id, id))

    // Fetch the updated coupon
    const updatedResult = await db.select().from(Coupon).where(eq(Coupon.id, id)).limit(1)
    const updatedCoupon = updatedResult[0]

    // Format the response
    return c.json({
      ...updatedCoupon,
      discount: parseFloat(updatedCoupon.discount),
      maxDiscount: updatedCoupon.maxDiscount ? parseFloat(updatedCoupon.maxDiscount) : null,
      createdAt: new Date(updatedCoupon.createdAt).toISOString(),
      updatedAt: new Date(updatedCoupon.updatedAt).toISOString(),
    })
  } catch (error) {
    console.error('Error updating coupon:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
