import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { db } from '../../db'
import { Order } from '../../db/schema'

export const ordersRoutes = new Hono()

ordersRoutes.get('/get-my-subscriptions', async (c) => {
  const q = c.req.query()
  try {
    const data = await db.select().from(Order).where(eq(Order.phone, q.phone))
    if (!data[0]) throw { status: 404, message: 'Subscription not found' }
    return c.json(data[0])
  } catch (e) {
    throw new HTTPException(401, { message: 'Subscription not found', cause: e })
  }
})

ordersRoutes.get('/public', async (c) => {
  const { order_no, phone, otp } = c.req.query()
  if (!order_no) {
    return c.json({ status: 404, message: 'order_no required' })
  }
  const data = await db.select().from(Order).where(eq(Order.id, order_no))
  if (!data[0]) throw { status: 404, message: 'Subscription not found' }
  return c.json(data[0])
})
