import { db } from '../../server/db'
import { Food, Order, OrderItem, User, HostProfile } from '../../server/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  // TODO: Get user ID from session/auth
  // For now, using a mock host ID
  const mockHostId = 'mock-host-id'

  try {
    // Get host's foods
    const foods = await db
      .select({
        id: Food.id,
        name: Food.name,
        price: Food.price,
        isAvailable: Food.isAvailable,
        rating: Food.rating,
        totalRatings: Food.totalRatings
      })
      .from(Food)
      .where(eq(Food.hostId, mockHostId))

    // Get host's orders
    const orders = await db
      .select({
        id: Order.id,
        status: Order.status,
        totalAmount: Order.totalAmount,
        createdAt: Order.createdAt,
        buyerName: User.name,
        foodName: Food.name,
        quantity: OrderItem.quantity
      })
      .from(Order)
      .leftJoin(OrderItem, eq(Order.id, OrderItem.orderId))
      .leftJoin(Food, eq(OrderItem.foodId, Food.id))
      .leftJoin(User, eq(Order.buyerId, User.id))
      .where(eq(Order.hostId, mockHostId))
      .orderBy(desc(Order.createdAt))
      .limit(10)

    // Calculate stats
    const totalFoods = foods.length
    const activeOrders = orders.filter(order => order.status && ['pending', 'confirmed', 'preparing'].includes(order.status)).length
    const totalOrders = orders.length
    const averageRating = foods.length > 0
      ? foods.reduce((sum, food) => sum + (food.rating ? parseFloat(food.rating) : 0), 0) / foods.length
      : 0
    const totalEarnings = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0)

    // Transform orders for display
    const recentOrders = orders.map(order => ({
      id: order.id,
      customerName: order.buyerName || 'Unknown Customer',
      foodName: order.foodName || 'Unknown Food',
      quantity: order.quantity || 1,
      totalAmount: parseFloat(order.totalAmount),
      status: order.status,
      orderTime: order.createdAt.toISOString()
    }))

    return {
      hostStats: {
        totalFoods,
        activeOrders,
        totalOrders,
        averageRating: Math.round(averageRating * 10) / 10,
        totalEarnings
      },
      myFoods: foods.map(food => ({
        id: food.id,
        name: food.name,
        price: parseFloat(food.price),
        status: food.isAvailable ? 'available' : 'unavailable',
        orders: Math.floor(Math.random() * 20), // TODO: Calculate from actual order data
        rating: food.rating ? parseFloat(food.rating) : 0
      })),
      recentOrders
    }
  } catch (error) {
    console.error('Error loading host data:', error)
    return {
      hostStats: {
        totalFoods: 0,
        activeOrders: 0,
        totalOrders: 0,
        averageRating: 0,
        totalEarnings: 0
      },
      myFoods: [],
      recentOrders: []
    }
  }
}