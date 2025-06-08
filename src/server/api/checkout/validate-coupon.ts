import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../../db'
import { Coupon, Plan } from '../../db/schema'

export const validateCoupon = async ({ planId, couponCode }) => {
  // Fetch the plan for price calculation
  const plan = await db.query.Plan.findFirst({
    where: eq(Plan.id, planId),
  })

  if (!plan) {
    throw { status: 400, message: 'Invalid plan' }
  }

  // Find and validate coupon
  const coupon = await db.query.Coupon.findFirst({
    where: and(
      eq(Coupon.couponCode, couponCode),
      eq(Coupon.isActive, true),
      lte(sql`COALESCE(${Coupon.validFrom}, 0)`, Math.floor(Date.now() / 1000)),
      gte(
        sql`COALESCE(${Coupon.validTo}, ${Number.MAX_SAFE_INTEGER})`,
        Math.floor(Date.now() / 1000)
      )
    ),
  })

  if (!coupon) {
    throw {
      status: 400,
      message: 'Invalid or expired coupon code',
    }
  }

  // Calculate discount
  let discountAmount = 0
  if (coupon.discountType === 'percentage') {
    discountAmount = (plan.price * coupon.discount) / 100
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount
    }
  } else {
    // Fixed discount
    discountAmount = coupon.discount
  }

  // Final price after discount
  const finalPrice = Math.max(0, plan.price - discountAmount)
  return finalPrice
}
