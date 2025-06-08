import { and, eq, gte, lte, sql } from 'drizzle-orm'
import type { PaymentResponse } from '../utils/phonepe/phonepe-types'
import { PhonePeWrapper } from '../utils/phonepe/phonepe-wrapper'
import { placeOrder } from '../utils'
import db from '../../../db'
import { Coupon, Plan } from '../../../db/schema'
import { parsePhoneNumber } from '../../../utils'
import { createPostPaymentChecksumHeader } from '../utils/phonepe/utils'
import axios from 'axios'
import { phonepeApi } from './api-request'

export const phonepeCheckout = async ({ phone, planId, totalAmount, couponCode, origin }: any) => {
  // Validate plan exists
  const plan = await db.query.Plan.findFirst({
    where: eq(Plan.id, planId),
  })

  if (!plan) {
    throw { message: 'Invalid plan' }
  }

  // Validate coupon if provided
  let finalAmount = totalAmount
  if (couponCode) {
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

    if (coupon) {
      if (coupon.discountType === 'percentage') {
        const discountAmount = (totalAmount * coupon.discount) / 100
        // Apply max discount cap if available
        finalAmount =
          coupon.maxDiscount && discountAmount > coupon.maxDiscount
            ? totalAmount - coupon.maxDiscount
            : totalAmount - discountAmount
      } else {
        // Fixed discount
        finalAmount = totalAmount - coupon.discount
      }

      // Ensure amount doesn't go below 0
      finalAmount = Math.max(0, finalAmount)
    }
  }
  const newOrder = await placeOrder({
    pgName: 'Phonepe',
    totalAmount: finalAmount,
    planId: planId,
    phone,
    couponCode,
  })
  let customerPhone = phone
  // Validate phone number
  if (!customerPhone) {
    throw {
      status: 400,
      message: 'Phone number is required',
    }
  }
  customerPhone = parsePhoneNumber(customerPhone)

  // Generate a unique merchant transaction ID (max 35 chars)
  const timestamp = Date.now().toString()
  const merchantTransactionId = `TXN${timestamp.slice(-12)}`

  // Prepare the payment request
  const amount = Math.round(newOrder.totalAmount) // Convert to paise

  const postData = {
    merchantId: process.env.PHONEPE_MERCHANT_ACCOUNT,
    merchantTransactionId,
    merchantUserId: newOrder.customerId?.toString() || `CUST${Date.now().toString().slice(-8)}`,
    amount: amount,
    redirectUrl: `${origin}/api/checkout/phonepe-capture?order_no=${newOrder.id}&pg=phonepe&merchant_transaction_id=${merchantTransactionId}&origin=${origin}`,
    redirectMode: 'GET',
    callbackUrl: `${origin}/api/checkout/phonepe-capture?order_no=${newOrder.id}&pg=phonepe&merchant_transaction_id=${merchantTransactionId}&origin=${origin}`,
    mobileNumber: customerPhone.replace(/\D/g, '').slice(-10), // Ensure 10 digit number
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  }

  try {
    const { data } = await phonepeApi({ type: 'pay', postData })
    return { redirectUrl: data, newOrder }
  } catch (error: unknown) {
    console.error(
      'PhonePe Checkout Error:',
      error.response?.data,
      PHONEPE_MERCHANT_ACCOUNT,
      PHONEPE_SALT,
      PHONEPE_MODE
    )

    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'Payment processing failed'

    throw {
      status: 500,
      message: errorMessage,
      details: error,
    }
  }
}
