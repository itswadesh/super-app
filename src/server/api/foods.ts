import { Hono, type Context } from 'hono'
import { db } from '../db'
import { Food, Category, User, Vendor } from '../db/schema'
import { eq, and, like, or, desc, sql } from 'drizzle-orm'
import { authenticate } from '../middlewares'

declare module 'hono' {
  interface HonoRequest {
    user?: {
      id: string
      name: string
      email: string
      phone: string
      role: string
    }
  }
}

export const routes = new Hono()

// Get all foods with optional filtering
routes.get('/', async (c) => {
  try {
    const search = c.req.query('search')
    const category = c.req.query('category')
    const vegetarian = c.req.query('vegetarian')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = parseInt(c.req.query('offset') || '0')

    const whereConditions = []

    if (search) {
      whereConditions.push(
        or(like(Food.name, `%${search}%`), like(Food.description, `%${search}%`))
      )
    }

    if (category && category !== 'all') {
      whereConditions.push(eq(Food.categoryId, category))
    }

    if (vegetarian !== undefined) {
      const isVeg = vegetarian === 'true'
      whereConditions.push(eq(Food.isVegetarian, isVeg))
    }

    whereConditions.push(eq(Food.isAvailable, true))

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
        rating: Food.rating,
        totalRatings: Food.totalRatings,
        hostId: Food.hostId,
        hostName: User.name,
        hostAddress: Vendor.address,
        hostCity: Vendor.city,
        categoryName: Category.name,
      })
      .from(Food)
      .leftJoin(User, eq(Food.hostId, User.id))
      .leftJoin(Vendor, eq(Food.hostId, Vendor.userId))
      .leftJoin(Category, eq(Food.categoryId, Category.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(Food.createdAt))
      .limit(limit)
      .offset(offset)

    // Transform the data to match the expected format
    const transformedFoods = foods.map((food) => ({
      id: food.id,
      name: food.name,
      description: food.description,
      price: parseFloat(food.price),
      image: food.image || '/api/placeholder/300/200',
      category: food.categoryName || 'Uncategorized',
      isVegetarian: food.isVegetarian,
      preparationTime: food.preparationTime || 30,
      rating: food.rating ? parseFloat(food.rating) : 0,
      totalRatings: food.totalRatings || 0,
      isMyFood: c.req.user?.id === food.hostId,
      host: {
        name: food.hostName || 'Unknown Host',
        rating: 0, // Vendor table doesn't have rating
        location: `${food.hostAddress || 'Unknown Address'}, ${food.hostCity || 'Unknown City'}`,
      },
    }))

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(Food)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

    const total = totalResult[0]?.count || 0

    return c.json({
      foods: transformedFoods,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    })
  } catch (error) {
    console.error('API Error:', error)
    return c.json({ message: 'Cannot convert undefined or null to object', status: 500 }, 500)
  }
})

// Get categories
routes.get('/categories', async (c) => {
  const categories = await db
    .select({
      id: Category.id,
      name: Category.name,
      slug: Category.slug,
    })
    .from(Category)
    .where(eq(Category.isActive, true))

  // Add "All Categories" option
  const allCategories = [{ id: 'all', name: 'All Categories' }, ...categories]

  return c.json(allCategories)
})

// Host-specific endpoints

// Get foods for a specific host
routes.get('/my', authenticate, async (c) => {
const hostId = c.get('user')?.id
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
      createdAt: Food.createdAt,
      categoryName: Category.name,
    })
    .from(Food)
    .leftJoin(Category, eq(Food.categoryId, Category.id))
    .where(eq(Food.hostId, hostId))
    .orderBy(desc(Food.createdAt))

  const transformedFoods = foods.map((food) => ({
    id: food.id,
    name: food.name,
    description: food.description,
    price: parseFloat(food.price),
    image: food.image || '/api/placeholder/300/200',
    category: food.categoryName || 'Uncategorized',
    isVegetarian: food.isVegetarian,
    preparationTime: food.preparationTime || 30,
    isAvailable: food.isAvailable,
    rating: food.rating ? parseFloat(food.rating) : 0,
    totalRatings: food.totalRatings || 0,
    createdAt: food.createdAt,
  }))

  return c.json(transformedFoods)
})

// Get food by ID
routes.get('/:id', async (c) => {
  const id = c.req.param('id')

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
      rating: Food.rating,
      totalRatings: Food.totalRatings,
      hostId: Food.hostId,
      hostName: User.name,
      hostAddress: Vendor.address,
      hostCity: Vendor.city,
      categoryName: Category.name,
    })
    .from(Food)
    .leftJoin(User, eq(Food.hostId, User.id))
    .leftJoin(Vendor, eq(Food.hostId, Vendor.userId))
    .leftJoin(Category, eq(Food.categoryId, Category.id))
    .where(eq(Food.id, id))

  if (foods.length === 0) {
    return c.json({ error: 'Food not found' }, 404)
  }

  const food = foods[0]
  const transformedFood = {
    id: food.id,
    name: food.name,
    description: food.description,
    price: parseFloat(food.price),
    image: food.image || '/api/placeholder/300/200',
    category: food.categoryName || 'Uncategorized',
    isVegetarian: food.isVegetarian,
    preparationTime: food.preparationTime || 30,
    rating: food.rating ? parseFloat(food.rating) : 0,
    totalRatings: food.totalRatings || 0,
    isMyFood: c.req.user?.id === food.hostId,
    host: {
      name: food.hostName || 'Unknown Host',
      rating: 0, // Vendor table doesn't have rating
      location: `${food.hostAddress || 'Unknown Address'}, ${food.hostCity || 'Unknown City'}`,
    },
  }

  return c.json(transformedFood)
})

// Create a new food item
routes.post('/', authenticate, async (c: Context) => {
  const body = await c.req.json()
const hostId = c.get('user')?.id
  const {
    name,
    description,
    price,
    categoryId,
    isVegetarian = false,
    preparationTime = 30,
    image,
    ingredients,
    allergens,
  } = body

  if (!hostId || !name || !price) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  // Handle categoryId - it could be a UUID, a category name/slug, or null/undefined
  let actualCategoryId = categoryId

  if (categoryId) {
    // Check if categoryId is not a valid UUID (i.e., it's a category name/slug)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(categoryId)) {
      // Look up category by slug
      const category = await db
        .select({ id: Category.id })
        .from(Category)
        .where(eq(Category.slug, categoryId))
        .limit(1)

      if (category.length === 0) {
        return c.json({ error: 'Invalid category' }, 400)
      }

      actualCategoryId = category[0].id
    }
  } else {
    // If no category provided, set to null
    actualCategoryId = null
  }

  // Generate slug from name
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Ensure slug is unique
  let existingFood = await db.select({ id: Food.id }).from(Food).where(eq(Food.slug, slug)).limit(1)

  let counter = 1
  const originalSlug = slug
  while (existingFood.length > 0) {
    slug = `${originalSlug}-${counter}`
    existingFood = await db.select({ id: Food.id }).from(Food).where(eq(Food.slug, slug)).limit(1)
    counter++
  }

  const newFood = await db
    .insert(Food)
    .values({
      hostId,
      name,
      slug,
      description: description || null,
      price: price.toString(),
      categoryId: actualCategoryId || null,
      isVegetarian,
      preparationTime,
      image,
      ingredients,
      allergens,
    })
    .returning()

  return c.json(newFood[0], 201)
})

// Update a food item
routes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  // Check ownership
  const food = await db.select({ hostId: Food.hostId }).from(Food).where(eq(Food.id, id)).limit(1)
  if (food.length === 0) {
    return c.json({ error: 'Food not found' }, 404)
  }
  if (c.req.user?.id !== food[0].hostId) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  const updateData: any = {}

  if (body.name !== undefined) updateData.name = body.name
  if (body.description !== undefined) updateData.description = body.description || null
  if (body.price !== undefined) updateData.price = body.price.toString()

  // Handle categoryId - it could be a UUID, a category name/slug, or null/undefined
  if (body.categoryId !== undefined) {
    let actualCategoryId = body.categoryId

    if (body.categoryId) {
      // Check if categoryId is not a valid UUID (i.e., it's a category name/slug)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(body.categoryId)) {
        // Look up category by slug
        const category = await db
          .select({ id: Category.id })
          .from(Category)
          .where(eq(Category.slug, body.categoryId))
          .limit(1)

        if (category.length === 0) {
          return c.json({ error: 'Invalid category' }, 400)
        }

        actualCategoryId = category[0].id
      }
    } else {
      // If empty string or null provided, set to null
      actualCategoryId = null
    }

    updateData.categoryId = actualCategoryId
  }

  if (body.isVegetarian !== undefined) updateData.isVegetarian = body.isVegetarian
  if (body.preparationTime !== undefined) updateData.preparationTime = body.preparationTime
  if (body.image !== undefined) updateData.image = body.image
  if (body.ingredients !== undefined) updateData.ingredients = body.ingredients
  if (body.allergens !== undefined) updateData.allergens = body.allergens
  if (body.isAvailable !== undefined) updateData.isAvailable = body.isAvailable

  updateData.updatedAt = new Date()

  const updatedFood = await db.update(Food).set(updateData).where(eq(Food.id, id)).returning()

  if (updatedFood.length === 0) {
    return c.json({ error: 'Food not found' }, 404)
  }

  return c.json(updatedFood[0])
})

// Delete a food item
routes.delete('/:id', async (c) => {
  const id = c.req.param('id')

  // Check ownership
  const food = await db.select({ hostId: Food.hostId }).from(Food).where(eq(Food.id, id)).limit(1)
  if (food.length === 0) {
    return c.json({ error: 'Food not found' }, 404)
  }
  if (c.req.user?.id !== food[0].hostId) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  const deletedFood = await db.delete(Food).where(eq(Food.id, id)).returning()

  if (deletedFood.length === 0) {
    return c.json({ error: 'Food not found' }, 404)
  }

  return c.json({ message: 'Food deleted successfully' })
})

// Toggle food availability
routes.patch('/:id/availability', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { isAvailable } = body

  // Check ownership
  const food = await db.select({ hostId: Food.hostId }).from(Food).where(eq(Food.id, id)).limit(1)
  if (food.length === 0) {
    return c.json({ error: 'Food not found' }, 404)
  }
  if (c.req.user?.id !== food[0].hostId) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  if (isAvailable === undefined) {
    return c.json({ error: 'isAvailable field is required' }, 400)
  }

  const updatedFood = await db
    .update(Food)
    .set({
      isAvailable,
      updatedAt: new Date(),
    })
    .where(eq(Food.id, id))
    .returning()

  if (updatedFood.length === 0) {
    return c.json({ error: 'Food not found' }, 404)
  }

  return c.json(updatedFood[0])
})

// Legacy functions for backward compatibility
// Legacy functions removed - use API routes directly
