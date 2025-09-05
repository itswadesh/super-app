import { eq, desc } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { db } from '../../db'
import { Order, OrderItem, Food, User, Vendor } from '../../db/schema'

export const ordersRoutes = new Hono()

ordersRoutes.get('/user-orders', async (c) => {
  const q = c.req.query()
  try {
    const data = await db
      .select()
      .from(Order)
      .leftJoin(User, eq(Order.userId, User.id))
      .where(eq(User.phone, q.phone))
    if (!data[0]) throw { status: 404, message: 'Orders not found' }
    return c.json(data[0])
  } catch (e) {
    throw new HTTPException(401, { message: 'Orders not found', cause: e })
  }
})

ordersRoutes.get('/public', async (c) => {
  const { order_no } = c.req.query()
  if (!order_no) {
    return c.json({ status: 404, message: 'order_no required' })
  }
  const data = await db.select().from(Order).where(eq(Order.id, order_no))
  if (!data[0]) throw { status: 404, message: 'Subscription not found' }
  return c.json(data[0])
})

// Get orders for a specific host
ordersRoutes.get('/my', async (c) => {
  const hostId = c.req.user?.id || 'dd4c4faf-4ee0-4c64-88e5-acb5e7aca9ec'
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
    .leftJoin(User, eq(Order.userId, User.id))
    .where(eq(Order.hostId, hostId))
    .orderBy(desc(Order.createdAt))
    .limit(limit)

  // Transform orders for display
  const recentOrders = orders.map((order) => ({
    id: order.id,
    customerName: order.buyerName || 'Unknown User',
    foodName: order.foodName || 'Unknown Food',
    quantity: order.quantity || 1,
    totalAmount: parseFloat(order.totalAmount),
    status: order.status,
    orderTime: order.createdAt.toISOString(),
  }))

  return c.json(recentOrders)
})

// Get analytics/stats for a specific host
ordersRoutes.get('/my/analytics', async (c) => {
  const hostId = c.req.user?.id || 'dd4c4faf-4ee0-4c64-88e5-acb5e7aca9ec'

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

// Get orders for the authenticated user
ordersRoutes.get('/user-orders', async (c) => {
  const userId = c.req.user?.id

  if (!userId) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  try {
    // Get user's orders with full details
    const ordersData = await db
      .select({
        id: Order.id,
        orderNumber: Order.orderNumber,
        status: Order.status,
        totalAmount: Order.totalAmount,
        deliveryFee: Order.deliveryFee,
        taxAmount: Order.taxAmount,
        deliveryAddress: Order.deliveryAddress,
        specialInstructions: Order.specialInstructions,
        estimatedDelivery: Order.estimatedDeliveryTime,
        actualDelivery: Order.actualDeliveryTime,
        createdAt: Order.createdAt,
        hostId: Order.hostId,
        hostName: User.name,
        hostPhone: User.phone,
        hostLocation: Vendor.address,
      })
      .from(Order)
      .leftJoin(User, eq(Order.hostId, User.id))
      .leftJoin(Vendor, eq(Order.hostId, Vendor.userId))
      .where(eq(Order.userId, userId))
      .orderBy(desc(Order.createdAt))

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        const items = await db
          .select({
            name: Food.name,
            quantity: OrderItem.quantity,
            unitPrice: OrderItem.unitPrice,
            totalPrice: OrderItem.totalPrice,
          })
          .from(OrderItem)
          .leftJoin(Food, eq(OrderItem.foodId, Food.id))
          .where(eq(OrderItem.orderId, order.id))

        return {
          ...order,
          items: items.map((item) => ({
            name: item.name || 'Unknown Item',
            quantity: item.quantity,
            price: parseFloat(item.unitPrice) * item.quantity,
          })),
          host: {
            name: order.hostName || 'Unknown Host',
            phone: order.hostPhone || '',
            location: order.hostLocation || 'Unknown Location',
          },
          totalAmount: parseFloat(order.totalAmount),
          deliveryFee: parseFloat(order.deliveryFee || '0'),
          taxAmount: parseFloat(order.taxAmount || '0'),
          createdAt:
            order.createdAt.toISOString().split('T')[0] +
            ' ' +
            new Date(order.createdAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
          estimatedDelivery: order.estimatedDelivery
            ? new Date(order.estimatedDelivery).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
            : null,
          actualDelivery: order.actualDelivery
            ? new Date(order.actualDelivery).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
            : null,
          deliveryAddress:
            typeof order.deliveryAddress === 'object' && order.deliveryAddress !== null
              ? (order.deliveryAddress as any)?.address || JSON.stringify(order.deliveryAddress)
              : order.deliveryAddress || 'No address provided',
        }
      })
    )

    // Calculate stats
    const stats = {
      totalOrders: ordersWithItems.length,
      deliveredOrders: ordersWithItems.filter((o) => o.status === 'delivered').length,
      inProgressOrders: ordersWithItems.filter(
        (o) => o.status && ['preparing', 'ready', 'confirmed'].includes(o.status)
      ).length,
      totalSpent: ordersWithItems.reduce((sum, order) => sum + order.totalAmount, 0),
    }

    return c.json({
      orders: ordersWithItems,
      stats,
    })
  } catch (error) {
    console.error('Error fetching user orders:', error)
    throw new HTTPException(500, { message: 'Failed to fetch orders' })
  }
})
