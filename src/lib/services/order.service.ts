import { apiService } from './api.service'

// API Base URL - Can be configured to point to Hono server

export const getPlans = async () => {
  try {
    const res = await apiService.get('plans')
    return res?.data?.plans || []
  } catch (e) {
    console.error('Error getting plans:', e)
    return []
  }
}

export const getOrder = async ({ order_no }) => {
  try {
    const res = await apiService.get(`orders?order_no=${order_no}`)
    return res?.data || {}
  } catch (e) {
    console.error('Error getting order:', e)
    return {}
  }
}

export const paySuccessPageHit = async ({ orderId, paymentMode, status }) => {
  let res = {}

  res = await apiService.post('orders/pay-success-page-hit', {
    orderId,
    paymentMode,
    status,
  })
  return res || {}
}

export const razorpayCheckout = async ({ order_no = null, plan_id, origin, total_amount }) => {
  let res = {}
  res = await apiService.post('checkout/razorpay', {
    order_no: order_no,
    return_url: `${origin}/subscription/process`,
    pg_name: 'Razorpay',
    total_amount: total_amount * 100,
    plan_id,
  })
  return res || {}
}

export const razorpayCapture = async ({
  razorpay_order_id,
  razorpay_payment_id,
  origin,
  sid = null,
}) => {
  let res = {}

  res = await apiService.post('checkout/razorpay-capture', {
    razorpay_order_id,
    razorpay_payment_id,
  })

  return res || {}
}

interface PhonePeCheckoutParams {
  plan_id: string | number
  origin: string
  phone: string
  total_amount: number
  sid?: string | null
  couponCode?: string | null
}

export const phonepeCheckout = async ({
  plan_id,
  phone,
  total_amount,
  couponCode = null,
  origin,
}: PhonePeCheckoutParams): Promise<string> => {
  try {
    // Use the new Hono API endpoint
    const res = await apiService.post('checkout/phonepe', {
      plan_id,
      phone,
      total_amount,
      couponCode,
      origin,
    })

    if (res?.success) {
      return res.data
    }

    throw new Error(res?.error || 'Unable to process payment')
  } catch (e) {
    console.error('PhonePe checkout error::', e)
    throw e
  }
}

export const validateCoupon = async ({ couponCode, plan_id }) => {
  try {
    // Use the new Hono API endpoint
    const res = await apiService.post('checkout/validate-coupon', {
      couponCode,
      plan_id,
    })
    return res?.data
  } catch (e) {
    console.error('Error validating coupon:', e)
    throw e
  }
}

export const revenuecatCheckout = async ({
  order_no = null,
  plan_id,
  origin,
  total_amount,
  phone,
}: any) => {
  let res = {}

  res = await apiService.post('checkout/revenuecat', {
    order_no: order_no,
    phone,
    return_url: `${origin}/subscription/process`,
    pg_name: 'revenuecat',
    total_amount: total_amount * 100,
    plan_id,
  })

  return res || {}
}

export const revenuecatCapture = async ({ order_no, amount_paid, payment_reference_id }: any) => {
  try {
    const res = await apiService.post('checkout/revenuecat-capture', {
      order_no,
      amount_paid,
      payment_reference_id,
    })

    return res?.data || {}
  } catch (e) {
    console.error('Error capturing revenue cat payment:', e)
    return {}
  }
}
