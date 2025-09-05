import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db } from '../../db'
import { Order, OrderItem, Plan } from '../../db/schema' // Coupon schema might be needed if validateCouponUtil returns full Coupon object
import { afterOrderConfirmation, placeOrder } from './utils' // Assuming placeOrder is in utils
import { capturePhonepe } from './phonepe/capture'
import { phonepeCheckout } from './phonepe/checkout'
import { validateCoupon as validateCouponUtil } from './validate-coupon'

// Create a checkout router
export const checkoutRoutes = new Hono()

// Validation schema for the PhonePe checkout request
const phonepeCheckoutSchema = z.object({
  plan_id: z.string().min(1, 'Plan ID is required'),
  phone: z.string().min(10, 'Valid phone number is required').max(13),
  total_amount: z.number().min(1, 'Amount must be at least 1'),
  couponCode: z.string().optional(),
  origin: z.string().optional(),
})

// Validator middleware
const validatePhonepeCheckout = zValidator('json', phonepeCheckoutSchema)

// Format phone number
function parsePhoneNumber(phone: string): string {
  phone = phone.replace(/\s/g, '')
  if (!phone.startsWith('+')) {
    if (phone.length === 10) {
      phone = `+91${phone}`
    }
  }
  return phone
}

// PhonePe checkout endpoint
checkoutRoutes
  .post('/phonepe', validatePhonepeCheckout, async (c) => {
    try {
      const { plan_id, phone, total_amount, couponCode, origin } = await c.req.json()
      const newOrder = await phonepeCheckout({
        pg_name: 'Phonepe',
        totalAmount: total_amount,
        planId: plan_id,
        phone: parsePhoneNumber(phone),
        couponCode,
        origin,
      })
      return c.json(newOrder, 200)
    } catch (e: any) {
      // console.error('PhonePe checkout error:.', e)
      return c.json({ error: e.message || 'PhonePe checkout failed' }, e.status || 500)
    }
  })
  .get('/phonepe-capture', async (c) => {
    try {
      const { order_no, origin, pg_name } = c.req.query()
      if (!order_no) {
        return c.json({ error: 'order_no is required' }, 400)
      }
      // capturePhonepe is expected to handle the response (e.g., redirect or JSON)
      await capturePhonepe({ c, order_no, origin, pg_name })
    } catch (e: any) {
      console.error('PhonePe capture error:', e)
      return c.json({ error: e.message || 'PhonePe capture failed' }, e.status || 500)
    }
  })

// Validate coupon endpoint
checkoutRoutes.post('/validate-coupon', async (c) => {
  try {
    const { couponCode, plan_id } = await c.req.json()
    if (!couponCode) return c.json({ error: 'Coupon code is required' }, 400)
    if (!plan_id) return c.json({ error: 'Plan ID is required' }, 400)

    const validationResult = await validateCouponUtil({ couponCode, planId: plan_id })
    return c.json({
      success: true,
      data: validationResult,
    })
  } catch (error: any) {
    console.error('Coupon validation error:', error)
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to validate coupon',
      },
      error.status || 500
    )
  }
})

// Verify payment status
checkoutRoutes.get('/verify/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId')
    const order = await db.query.Order.findFirst({
      where: eq(Order.id, orderId),
    })
    if (!order) return c.json({ error: 'Order not found' }, 404)
    return c.json({
      orderId: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      isPaid: !!order.isPaid,
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return c.json({ error: error.message || 'An unknown error occurred' }, error.status || 500)
  }
})

// Webhook for PhonePe
checkoutRoutes.post('/webhook/phonepe', async (c) => {
  try {
    const data = await c.req.json()
    // TODO: Add actual PhonePe signature verification logic here
    const { merchantTransactionId, status, amount, providerReferenceId } = data.data // Adjust path based on actual payload
    const orderId = merchantTransactionId

    if (!orderId) return c.json({ error: 'Order ID (merchantTransactionId) missing' }, 400)

    const order = await db.query.Order.findFirst({ where: eq(Order.id, orderId) })
    if (!order) return c.json({ error: `Order ${orderId} not found` }, 404)

    let paymentStatusInternal = 'PENDING'
    if (status === 'PAYMENT_SUCCESS') paymentStatusInternal = 'PAID'
    else if (['PAYMENT_ERROR', 'TIMED_OUT', 'PAYMENT_DECLINED'].includes(status))
      paymentStatusInternal = 'FAILED'

    await afterOrderConfirmation({
      order,
      amount_paid: amount, // Amount from PhonePe might be in paise
      paymentStatus: paymentStatusInternal,
      payment_reference_id: providerReferenceId,
      pg_name: 'Phonepe',
    })
    return c.json({ success: true, message: 'Webhook processed' })
  } catch (error: any) {
    console.error('PhonePe webhook error:', error)
    return c.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      200 // Acknowledge receipt to PhonePe
    )
  }
})

// Simulate payment completion (for testing)
checkoutRoutes.post('/simulate-payment', async (c) => {
  try {
    const { orderId, status = 'SUCCESS' } = await c.req.json()
    if (!orderId) return c.json({ error: 'orderId is required' }, 400)

    const order = await db.query.Order.findFirst({ where: eq(Order.id, orderId) })
    if (!order) return c.json({ error: `Order ${orderId} not found` }, 404)

    await afterOrderConfirmation({
      order,
      amount_paid: order.totalAmount,
      paymentStatus: status === 'SUCCESS' ? 'PAID' : 'FAILED',
      payment_reference_id: `simulated_${nanoid()}`,
      pg_name: 'Simulation',
    })
    return c.json({ success: true, message: `Payment for order ${orderId} simulated as ${status}` })
  } catch (error: any) {
    console.error('Payment simulation error:', error)
    return c.json({ error: error.message || 'An unknown error occurred' }, error.status || 500)
  }
})

// Razorpay checkout
checkoutRoutes.post('/checkout/razorpay', async (c) => {
  try {
    const { total_amount, plan_id, phone, couponCode } = await c.req.json()
    let finalAmount = total_amount
    if (couponCode && plan_id) {
      try {
        const couponData = await validateCouponUtil({ couponCode, planId: plan_id })
        finalAmount = couponData.finalPrice
      } catch (couponError: any) {
        console.warn(`Coupon ${couponCode} validation failed: ${couponError.message}`)
      }
    }

    const newOrder = await placeOrder({
      pgName: 'Razorpay',
      totalAmount: finalAmount,
      planId: plan_id,
      phone: phone ? parsePhoneNumber(phone) : undefined,
      couponCode: couponCode,
    })

    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const rzOrder = await razorpayInstance.orders.create({
      amount: newOrder.total_amount * 100, // Amount in paise
      currency: 'INR',
      receipt: newOrder.id.toString(),
      notes: { plan_id: newOrder.plan_id },
    })

    await db.update(Order).set({ payment_order_id: rzOrder.id }).where(eq(Order.id, newOrder.id))

    return c.json({
      key_id: process.env.RAZORPAY_KEY_ID,
      order_id: rzOrder.id,
      amount: rzOrder.amount,
      name: 'Super App Checkout',
      description: `Order ${newOrder.id}`,
      receipt_db_order_id: newOrder.id,
    })
  } catch (error: any) {
    console.error('Razorpay checkout error:', error)
    return c.json({ error: error.message || 'Razorpay checkout failed' }, error.status || 500)
  }
})

// Razorpay capture
checkoutRoutes.post('/checkout/razorpay-capture', async (c) => {
  let db_order_id_for_error_handling: string | undefined
  try {
    const args = await c.req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, receipt_db_order_id } = args
    db_order_id_for_error_handling = receipt_db_order_id

    // TODO: Verify Razorpay signature
    // import crypto from 'crypto';
    // const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!];
    // shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    // if (shasum.digest('hex') !== razorpay_signature) return c.json({ error: 'Invalid signature' }, 400);

    const order = await db.query.Order.findFirst({
      where: and(eq(Order.id, receipt_db_order_id), eq(Order.payment_order_id, razorpay_order_id)),
    })
    if (!order)
      return c.json({ error: `Order ${receipt_db_order_id} not found or ID mismatch` }, 404)

    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
    const paymentDetails = await razorpayInstance.payments.fetch(razorpay_payment_id)

    if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
      await afterOrderConfirmation({
        order,
        amount_paid: 0,
        payment_status: 'FAILED',
        payment_reference_id: razorpay_payment_id,
        pg_name: 'Razorpay',
      })
      return c.json(
        { error: `Payment ${paymentDetails.status}`, payment_status: paymentDetails.status },
        400
      )
    }

    const confirmedOrder = await afterOrderConfirmation({
      order,
      amount_paid: paymentDetails.amount / 100,
      payment_status: 'PAID',
      payment_reference_id: razorpay_payment_id,
      pg_name: 'Razorpay',
      phone: paymentDetails.contact ? parsePhoneNumber(paymentDetails.contact) : order.phone,
      email: paymentDetails.email || order.email,
    })

    const planDetails = await db.query.Plan.findFirst({
      where: eq(Plan.id, confirmedOrder.plan_id),
    })
    return c.json({
      order_no: confirmedOrder.id,
      plan_id: confirmedOrder.plan_id,
      plan_price: planDetails?.price,
      message: 'Payment successful',
    })
  } catch (error: any) {
    console.error('Razorpay capture error:', error)
    if (db_order_id_for_error_handling) {
      const order = await db.query.Order.findFirst({
        where: eq(Order.id, db_order_id_for_error_handling),
      })
      if (order && order.payment_status !== 'PAID') {
        // Avoid overwriting a successful payment
        await afterOrderConfirmation({
          order,
          amount_paid: 0,
          payment_status: 'FAILED',
          payment_reference_id: (await c.req.json()).razorpay_payment_id,
          pg_name: 'Razorpay',
        })
      }
    }
    return c.json({ error: error.message || 'Razorpay capture failed' }, error.status || 500)
  }
})

// RevenueCat checkout (create order before RC purchase)
checkoutRoutes.post('/checkout/revenuecat', async (c) => {
  try {
    const { total_amount, plan_id, phone, couponCode, user_id } = await c.req.json()
    let finalAmount = total_amount
    if (couponCode && plan_id) {
      try {
        const couponData = await validateCouponUtil({ couponCode, planId: plan_id })
        finalAmount = couponData.finalPrice
      } catch (couponError: any) {
        console.warn(`Coupon ${couponCode} validation failed: ${couponError.message}`)
      }
    }

    const newOrder = await placeOrder({
      pgName: 'RevenueCat',
      totalAmount: finalAmount,
      planId: plan_id,
      phone: phone ? parsePhoneNumber(phone) : undefined,
      couponCode: couponCode,
      userId: user_id,
    })
    return c.json({
      order_no: newOrder.id,
      plan_id: newOrder.plan_id,
      plan_price: newOrder.total_amount,
      message: 'Order created for RevenueCat purchase.',
    })
  } catch (error: any) {
    console.error('RevenueCat order creation error:', error)
    return c.json(
      { error: error.message || 'RevenueCat order creation failed' },
      error.status || 500
    )
  }
})

// RevenueCat capture (webhook or client confirmation)
checkoutRoutes.post('/checkout/revenuecat-capture', async (c) => {
  try {
    const { order_no, payment_reference_id, amount_paid, phone, email, user_id } =
      await c.req.json()
    if (!order_no) return c.json({ error: 'order_no is required' }, 400)
    if (!payment_reference_id) return c.json({ error: 'Payment reference ID is required' }, 400)

    const order = await db.query.Order.findFirst({
      where: and(eq(Order.id, order_no), eq(Order.pg_name, 'RevenueCat')),
    })
    if (!order) return c.json({ error: `RevenueCat order ${order_no} not found` }, 404)
    // Optionally: if (order.user_id !== user_id) return c.json({ error: 'User ID mismatch' }, 403);

    const confirmedOrder = await afterOrderConfirmation({
      order,
      amount_paid,
      payment_status: 'PAID',
      payment_reference_id,
      pg_name: 'RevenueCat',
      phone: phone ? parsePhoneNumber(phone) : order.phone,
      email: email || order.email,
    })
    return c.json({
      order_no: confirmedOrder.id,
      plan_id: confirmedOrder.plan_id,
      plan_price: confirmedOrder.total_amount,
      message: 'RevenueCat purchase confirmed.',
    })
  } catch (error: any) {
    console.error('RevenueCat capture error:', error)
    return c.json({ error: error.message || 'RevenueCat capture failed' }, error.status || 500)
  }
})

// Cash on Delivery checkout
checkoutRoutes.post('/cod', async (c) => {
  try {
    const { items, deliveryAddress, totalAmount, paymentMethod, orderDate } = await c.req.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Items are required' }, 400)
    }

    if (!deliveryAddress || !deliveryAddress.quarterNumber) {
      return c.json({ error: 'Delivery address is required' }, 400)
    }

    if (!totalAmount || totalAmount <= 0) {
      return c.json({ error: 'Valid total amount is required' }, 400)
    }

    // Get user ID from context (assuming authentication middleware sets this)
    const userId = c.req.user?.id || '550e8400-e29b-41d4-a716-446655440000' // fallback UUID
    const hostId = items[0]?.hostId || 'dd4c4faf-4ee0-4c64-88e5-acb5e7aca9ec' // Get hostId from first item

    // Generate order number
    const orderNumber = `COD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`

    // Calculate estimated delivery time (6:00 PM - 9:30 PM today)
    const now = new Date()
    const estimatedDeliveryTime = new Date(now)
    estimatedDeliveryTime.setHours(18, 0, 0, 0) // 6:00 PM

    // Insert order into database
    const [newOrder] = await db
      .insert(Order)
      .values({
        userId,
        hostId,
        orderNumber,
        status: 'confirmed',
        totalAmount: totalAmount.toString(),
        deliveryAddress,
        estimatedDeliveryTime,
        paymentStatus: 'pending', // COD payment is pending until delivery
        paymentMethod: paymentMethod || 'COD',
      })
      .returning()

    // Insert order items
    const orderItems = items.map((item: any) => ({
      orderId: newOrder.id,
      foodId: item.id || item.foodId,
      quantity: item.quantity,
      unitPrice: item.price.toString(),
      totalPrice: (item.price * item.quantity).toString(),
      specialRequests: item.specialRequests || null,
    }))

    await db.insert(OrderItem).values(orderItems)

    return c.json({
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      message: 'Order placed successfully',
      estimatedDelivery: '6:00 PM - 9:30 PM',
      status: newOrder.status,
      totalAmount: newOrder.totalAmount,
    })
  } catch (error: any) {
    console.error('COD checkout error:', error)
    return c.json({ error: error.message || 'COD checkout failed' }, error.status || 500)
  }
})
