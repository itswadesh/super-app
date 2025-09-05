import { db } from '../../server/db'
import { Order, OrderItem, Food, User, HostProfile } from '../../server/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  try {
    // Get user ID from authentication
    const userId = locals.user?.id

    if (!userId) {
      return {
        orders: [],
        stats: {
          totalOrders: 0,
          deliveredOrders: 0,
          inProgressOrders: 0,
          totalSpent: 0,
        },
      }
    }

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
        estimatedDelivery: Order.estimatedDelivery,
        actualDelivery: Order.actualDelivery,
        createdAt: Order.createdAt,
        hostId: Order.hostId,
        hostName: User.name,
        hostPhone: User.phone,
        hostLocation: HostProfile.location,
      })
      .from(Order)
      .leftJoin(User, eq(Order.hostId, User.id))
      .leftJoin(HostProfile, eq(Order.hostId, HostProfile.userId))
      .where(eq(Order.buyerId, userId))
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
        }
      })
    )

    // Calculate stats
    const stats = {
      totalOrders: ordersWithItems.length,
      deliveredOrders: ordersWithItems.filter((o) => o.status === 'delivered').length,
      inProgressOrders: ordersWithItems.filter((o) =>
        ['preparing', 'ready', 'confirmed'].includes(o.status)
      ).length,
      totalSpent: ordersWithItems.reduce((sum, order) => sum + order.totalAmount, 0),
    }

    return {
      orders: ordersWithItems,
      stats,
    }
  } catch (error) {
    console.error('Error loading orders:', error)
    return {
      orders: [],
      stats: {
        totalOrders: 0,
        deliveredOrders: 0,
        inProgressOrders: 0,
        totalSpent: 0,
      },
    }
  }
}
