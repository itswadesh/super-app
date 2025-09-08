import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, fetch }) => {
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

    // Check application status using API
    let applicationStatus = null
    try {
      const applicationResponse = await fetch('/api/applications/status')
      if (applicationResponse.ok) {
        applicationStatus = await applicationResponse.json()
      }
    } catch (error) {
      console.error('Error fetching application status:', error)
    }

    // Get host's foods using API
    let myFoods = []
    try {
      const foodsResponse = await fetch('/api/foods/my')
      if (foodsResponse.ok) {
        const foodsData = await foodsResponse.json()
        myFoods = foodsData.map((food: any) => ({
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
        }))
      }
    } catch (error) {
      console.error('Error fetching foods:', error)
    }

    // Get host's orders using API
    let recentOrders = []
    try {
      const ordersResponse = await fetch('/api/orders/my')
      if (ordersResponse.ok) {
        recentOrders = await ordersResponse.json()
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }

    // Get analytics/stats using API
    let hostStats = {
      totalFoods: 0,
      activeOrders: 0,
      totalOrders: 0,
      averageRating: 0,
      totalEarnings: 0,
    }
    try {
      const analyticsResponse = await fetch('/api/orders/my/analytics')
      if (analyticsResponse.ok) {
        hostStats = await analyticsResponse.json()
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }

    return {
      hostStats,
      myFoods,
      recentOrders,
      applicationStatus,
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
