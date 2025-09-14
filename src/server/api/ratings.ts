import { Hono } from 'hono'
import { db } from '../db'
import { FoodRating, HostRating, Product, Vendor, User } from '../db/schema'
import { eq, and, sql, avg } from 'drizzle-orm'
import { authenticate } from '../middlewares/auth'

export const ratingRoutes = new Hono()

// POST /api/ratings/food - Submit a food rating
ratingRoutes.post('/food', authenticate, async (c) => {
  try {
    const body = await c.req.json()
    const { foodId, rating, review, orderId } = body
    const user = c.get('user') as any

    if (!user?.id) {
      return c.json({ error: 'User not authenticated' }, 401)
    }

    if (!foodId || !rating || rating < 1 || rating > 5) {
      return c.json({ error: 'Invalid rating data. Rating must be between 1-5' }, 400)
    }

    // Check if food exists
    const food = await db.select().from(Product).where(eq(Product.id, foodId)).limit(1)
    if (food.length === 0) {
      return c.json({ error: 'Product not found' }, 404)
    }

    // Check if user already rated this food for this order
    const existingRating = await db
      .select()
      .from(FoodRating)
      .where(
        and(
          eq(FoodRating.foodId, foodId),
          eq(FoodRating.userId, user.id),
          eq(FoodRating.orderId, orderId)
        )
      )
      .limit(1)

    if (existingRating.length > 0) {
      return c.json({ error: 'You have already rated this food for this order' }, 409)
    }

    // Create the rating
    const newRating = await db
      .insert(FoodRating)
      .values({
        foodId,
        userId: user.id,
        orderId,
        rating,
        review: review || null,
      })
      .returning()

    // Update food's average rating
    await updateFoodRating(foodId)

    return c.json(newRating[0], 201)
  } catch (error) {
    console.error('Error creating food rating:', error)
    return c.json({ error: 'Failed to create rating' }, 500)
  }
})

// POST /api/ratings/vendor - Submit a vendor rating
ratingRoutes.post('/vendor', authenticate, async (c) => {
  try {
    const body = await c.req.json()
    const { vendorId, rating, review, orderId } = body
    const user = c.get('user') as any

    if (!user?.id) {
      return c.json({ error: 'User not authenticated' }, 401)
    }

    if (!vendorId || !rating || rating < 1 || rating > 5) {
      return c.json({ error: 'Invalid rating data. Rating must be between 1-5' }, 400)
    }

    // Check if vendor exists
    const vendor = await db.select().from(Vendor).where(eq(Vendor.id, vendorId)).limit(1)
    if (vendor.length === 0) {
      return c.json({ error: 'Vendor not found' }, 404)
    }

    // Check if user already rated this vendor for this order
    const existingRating = await db
      .select()
      .from(HostRating)
      .where(
        and(
          eq(HostRating.hostId, vendorId),
          eq(HostRating.userId, user.id),
          eq(HostRating.orderId, orderId)
        )
      )
      .limit(1)

    if (existingRating.length > 0) {
      return c.json({ error: 'You have already rated this vendor for this order' }, 409)
    }

    // Create the rating
    const newRating = await db
      .insert(HostRating)
      .values({
        hostId: vendorId,
        userId: user.id,
        orderId,
        rating,
        review: review || null,
      })
      .returning()

    // Update vendor's average rating
    await updateVendorRating(vendorId)

    return c.json(newRating[0], 201)
  } catch (error) {
    console.error('Error creating vendor rating:', error)
    return c.json({ error: 'Failed to create rating' }, 500)
  }
})

// GET /api/ratings/food/:foodId - Get ratings for a specific food
ratingRoutes.get('/food/:foodId', async (c) => {
  try {
    const foodId = c.req.param('foodId')

    if (!foodId) {
      return c.json({ error: 'Product ID is required' }, 400)
    }

    const ratings = await db
      .select({
        id: FoodRating.id,
        rating: FoodRating.rating,
        review: FoodRating.review,
        createdAt: FoodRating.createdAt,
        userName: User.name,
      })
      .from(FoodRating)
      .leftJoin(User, eq(FoodRating.userId, User.id))
      .where(eq(FoodRating.foodId, foodId))
      .orderBy(FoodRating.createdAt)

    return c.json(ratings)
  } catch (error) {
    console.error('Error fetching food ratings:', error)
    return c.json({ error: 'Failed to fetch ratings' }, 500)
  }
})

// GET /api/ratings/vendor/:vendorId - Get ratings for a specific vendor
ratingRoutes.get('/vendor/:vendorId', async (c) => {
  try {
    const vendorId = c.req.param('vendorId')

    if (!vendorId) {
      return c.json({ error: 'Vendor ID is required' }, 400)
    }

    const ratings = await db
      .select({
        id: HostRating.id,
        rating: HostRating.rating,
        review: HostRating.review,
        createdAt: HostRating.createdAt,
        userName: User.name,
      })
      .from(HostRating)
      .leftJoin(User, eq(HostRating.userId, User.id))
      .where(eq(HostRating.hostId, vendorId))
      .orderBy(HostRating.createdAt)

    return c.json(ratings)
  } catch (error) {
    console.error('Error fetching vendor ratings:', error)
    return c.json({ error: 'Failed to fetch ratings' }, 500)
  }
})

// Helper function to update food rating
async function updateFoodRating(foodId: string) {
  try {
    // Calculate average rating and count
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${FoodRating.rating})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(FoodRating)
      .where(eq(FoodRating.foodId, foodId))

    const avgRating = result[0]?.avgRating || 0
    const count = result[0]?.count || 0

    // Update food with new rating
    await db
      .update(Product)
      .set({
        rating: avgRating.toFixed(2),
        totalRatings: count,
        updatedAt: sql`NOW()`,
      })
      .where(eq(Product.id, foodId))

    console.log(`Updated food ${foodId} rating to ${avgRating.toFixed(2)} (${count} ratings)`)

    // Update vendor rating after food rating changes
    const food = await db
      .select({ hostId: Product.hostId })
      .from(Product)
      .where(eq(Product.id, foodId))
      .limit(1)
    if (food.length > 0) {
      await updateVendorRating(food[0].hostId)
    }
  } catch (error) {
    console.error('Error updating food rating:', error)
  }
}

// Helper function to update vendor rating based on their foods' ratings
async function updateVendorRating(vendorUserId: string) {
  try {
    // Get all foods for this vendor and calculate weighted average
    const foodsResult = await db
      .select({
        rating: Product.rating,
        totalRatings: Product.totalRatings,
      })
      .from(Product)
      .where(eq(Product.hostId, vendorUserId))

    if (foodsResult.length === 0) {
      console.log(`No foods found for vendor ${vendorUserId}`)
      return
    }

    // Calculate weighted average rating
    let totalWeightedRating = 0
    let totalRatings = 0

    for (const food of foodsResult) {
      const rating = food.rating ? parseFloat(food.rating) : 0
      const ratingsCount = food.totalRatings || 0

      totalWeightedRating += rating * ratingsCount
      totalRatings += ratingsCount
    }

    const avgRating = totalRatings > 0 ? totalWeightedRating / totalRatings : 0

    // Check if vendor record exists
    const vendorRecord = await db
      .select()
      .from(Vendor)
      .where(eq(Vendor.userId, vendorUserId))
      .limit(1)

    if (vendorRecord.length > 0) {
      // For now, we'll store the rating in a comment/log
      // Since Vendor table doesn't have a rating field, we could add one later
      console.log(
        `Vendor ${vendorUserId} average rating: ${avgRating.toFixed(2)} (${totalRatings} total ratings)`
      )
    }
  } catch (error) {
    console.error('Error updating vendor rating:', error)
  }
}
