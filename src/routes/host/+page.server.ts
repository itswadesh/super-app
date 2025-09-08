import { db } from '../../server/db'
import { Food, Order, OrderItem, User, Vendor } from '../../server/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  try {
    // TODO: Get actual host ID from authentication
    const hostId = locals.user?.id

    if (!hostId) {
      return {
        hostStats: {
          totalFoods: 0,
          activeOrders: 0,
          totalOrders: 0,
          averageRating: 0,
          totalEarnings: 0,
        },
        myFoods: [],
        recentOrders: [],
        applicationStatus: null,
      }
    }

    // Check application status
    let application = await db.query.Vendor.findFirst({ where: eq(Vendor.userId, hostId) })

    // If no application exists for this test user, create one
    // if (application.length === 0 && hostId === 'dd4c4faf-4ee0-4c64-88e5-acb5e7aca9ec') {
    // console.log('Creating test application for user:', hostId)
    // const testApplication = await db
    //   .insert(Vendor)
    //   .values({
    //     userId: hostId,
    //     fullName: 'Test Chef',
    //     email: 'test@example.com',
    //     phone: '0000000000',
    //     address: 'Test Address',
    //     idProof: 'test-proof',
    //     status: 'pending',
    //   })
    //   .returning()
    // application = testApplication
    // }

    // Get host's foods
    const foods = await db
      .select({
        id: Food.id,
        name: Food.name,
        description: Food.description,
        price: Food.price,
        image: Food.image,
        categoryId: Food.categoryId,
        isVegetarian: Food.isVegetarian,
        preparationTime: Food.preparationTime,
        isAvailable: Food.isAvailable,
        rating: Food.rating,
        totalRatings: Food.totalRatings,
      })
      .from(Food)
      .where(eq(Food.hostId, hostId))

    // Get host's orders
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
      .limit(10)

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

    return {
      hostStats: {
        totalFoods,
        activeOrders,
        totalOrders,
        averageRating: Math.round(averageRating * 10) / 10,
        totalEarnings,
      },
      myFoods: foods.map((food) => ({
        id: food.id,
        name: food.name,
        description: food.description,
        price: parseFloat(food.price),
        image: food.image,
        categoryId: food.categoryId,
        isVegetarian: food.isVegetarian,
        preparationTime: food.preparationTime,
        status: food.isAvailable ? 'available' : 'unavailable',
        orders: Math.floor(Math.random() * 20), // TODO: Calculate from actual order data
        rating: food.rating ? parseFloat(food.rating) : 0,
      })),
      recentOrders,
      applicationStatus: application ? application : null,
    }
  } catch (error) {
    console.error('Error loading host data:', error)
    return {
      hostStats: {
        totalFoods: 0,
        activeOrders: 0,
        totalOrders: 0,
        averageRating: 0,
        totalEarnings: 0,
      },
      myFoods: [],
      recentOrders: [],
      applicationStatus: null,
    }
  }
}
