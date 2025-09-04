import { eq, desc } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { db } from '../../db'
import { Order, OrderItem, Food, User } from '../../db/schema'

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

// Get orders for a specific host
ordersRoutes.get('/host/:hostId', async (c) => {
  const hostId = c.req.param('hostId')
  const limit = parseInt(c.req.query('limit') || '10')

  const orders = await db
    .select({
      id: Order.id,
      status: Order.status,
      totalAmount: Order.totalAmount,
      createdAt: Order.createdAt,
      buyerName: User.name,
      foodName: Food.name,
      quantity: OrderItem.quantity,
    })
    .from(Order)
    .leftJoin(OrderItem, eq(Order.id, OrderItem.orderId))
    .leftJoin(Food, eq(OrderItem.foodId, Food.id))
    .leftJoin(User, eq(Order.buyerId, User.id))
    .where(eq(Order.hostId, hostId))
    .orderBy(desc(Order.createdAt))
    .limit(limit)

  // Transform orders for display
  const recentOrders = orders.map((order) => ({
    id: order.id,
    customerName: order.buyerName || 'Unknown Customer',
    foodName: order.foodName || 'Unknown Food',
    quantity: order.quantity || 1,
    totalAmount: parseFloat(order.totalAmount),
    status: order.status,
    orderTime: order.createdAt.toISOString(),
  }))

  return c.json(recentOrders)
})

// Get analytics/stats for a specific host
ordersRoutes.get('/host/:hostId/analytics', async (c) => {
  const hostId = c.req.param('hostId')

  // Get foods for the host
  const foods = await db
    .select({
      id: Food.id,
      isAvailable: Food.isAvailable,
      rating: Food.rating,
      totalRatings: Food.totalRatings,
    })
    .from(Food)
    .where(eq(Food.hostId, hostId))

  // Get orders for the host
  const orders = await db
    .select({
      status: Order.status,
      totalAmount: Order.totalAmount,
    })
    .from(Order)
    .where(eq(Order.hostId, hostId))

  // Calculate stats
  const totalFoods = foods.filter((food) => food.isAvailable).length
  const activeOrders = orders.filter(
    (order) => order.status && ['pending', 'confirmed', 'preparing'].includes(order.status)
  ).length
  const totalOrders = orders.length
  const averageRating =
    foods.length > 0
      ? foods.reduce((sum, food) => sum + (food.rating ? parseFloat(food.rating) : 0), 0) /
        foods.length
      : 0
  const totalEarnings = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0)

  const hostStats = {
    totalFoods,
    activeOrders,
    totalOrders,
    averageRating: Math.round(averageRating * 10) / 10,
    totalEarnings,
  }

  return c.json(hostStats)
})
