import { and, eq, sql, like, or, desc } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { db } from '../../db'
import { Food, Category, User, Vendor } from '../../db/schema'
import { authenticate, optionalAuthenticate } from '../../middlewares/auth'

export const routes = new Hono()

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

// GET /api/foods - Get all foods with optional filtering
routes.get('/', optionalAuthenticate, async (c: Context) => {
  const search = c.req.query('search')
  const category = c.req.query('category')
  const vegetarian = c.req.query('vegetarian')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  try {
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
    whereConditions.push(eq(Vendor.status, 'approved'))

    // Debug: Check approved vendors
    const approvedVendors = await db
      .select({
        id: Vendor.id,
        userId: Vendor.userId,
        status: Vendor.status,
        fullName: Vendor.fullName,
      })
      .from(Vendor)
      .where(eq(Vendor.status, 'approved'))
    console.log('Approved vendors:', approvedVendors)

    // Debug: Check all foods
    const allFoods = await db
      .select({
        id: Food.id,
        name: Food.name,
        hostId: Food.hostId,
        isAvailable: Food.isAvailable,
      })
      .from(Food)
      .limit(50)
    console.log('All foods in database:', allFoods)

    // Debug: Check foods with vendor join
    const foodsWithVendors = await db
      .select({
        foodId: Food.id,
        foodName: Food.name,
        hostId: Food.hostId,
        isAvailable: Food.isAvailable,
        vendorId: Vendor.id,
        vendorUserId: Vendor.userId,
        vendorStatus: Vendor.status,
        vendorName: Vendor.fullName,
      })
      .from(Food)
      .leftJoin(Vendor, eq(Food.hostId, Vendor.userId))
      .limit(50)
    console.log('Foods with vendor join:', foodsWithVendors)

    // Debug: Check if approved vendors have foods
    if (approvedVendors.length > 0) {
      for (const vendor of approvedVendors) {
        const vendorFoods = await db
          .select({
            id: Food.id,
            name: Food.name,
            hostId: Food.hostId,
            isAvailable: Food.isAvailable,
          })
          .from(Food)
          .where(eq(Food.hostId, vendor.userId))
        console.log(`Foods for vendor ${vendor.fullName} (${vendor.userId}):`, vendorFoods)
      }
    }

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

    console.log('Filtered foods result:', foods)

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
      isMyFood: c.get('user')?.id === food.hostId,
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
      .leftJoin(User, eq(Food.hostId, User.id))
      .leftJoin(Vendor, eq(Food.hostId, Vendor.userId))
      .leftJoin(Category, eq(Food.categoryId, Category.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

    const total = +totalResult[0]?.count || 0

    return c.json({
      foods: transformedFoods,
      total,
      page,
      pageSize: limit,
    })
  } catch (error) {
    console.error('Error fetching foods:', error)
    return c.json({ foods: [], total: 0, page, pageSize: limit })
  }
})

// POST /api/foods - Create a new food
routes.post('/', authenticate, async (c: Context) => {
  // console.log('Received request body:......................', c.get('user'))
  try {
    const body = await c.req.json()
    const user = c.get('user')
    const hostId = user?.id
    const {
      name,
      description,
      price,
      categoryId,
      isVegetarian = false,
      preparationTime,
      image,
    } = body

    // console.log('Received request body:', body)
    // console.log(
    //   'categoryId value:',
    //   categoryId,
    //   'type:',
    //   typeof categoryId,
    //   'trimmed:',
    //   categoryId?.trim()
    // )

    // Validate required fields
    if (!hostId || !name || !price) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    // Generate slug from name
    const slug = generateSlug(name)

    // Check if host exists
    const host = await db.select().from(User).where(eq(User.id, hostId)).limit(1)
    if (host.length === 0) {
      return c.json({ error: 'Host not found' }, 404)
    }

    // Check if slug already exists
    const existingFood = await db.select().from(Food).where(eq(Food.slug, slug)).limit(1)

    if (existingFood.length > 0) {
      return c.json({ error: 'Food with this name already exists' }, 409)
    }

    // If categoryId is provided, look up the category UUID from the slug
    let categoryUuid = undefined
    console.log('Checking categoryId condition:', {
      categoryId,
      isEmptyString: categoryId === '',
      trimmed: categoryId?.trim(),
      isTruthy: !!categoryId,
      trimTruthy: !!categoryId?.trim(),
    })

    if (categoryId && typeof categoryId === 'string' && categoryId.trim().length > 0) {
      // console.log('CategoryId is valid, looking up UUID for slug:', categoryId)
      const category = await db
        .select()
        .from(Category)
        .where(eq(Category.slug, categoryId))
        .limit(1)
      if (category.length === 0) {
        return c.json({ error: 'Category not found' }, 404)
      }
      categoryUuid = category[0].id
      // console.log('Found category UUID:', categoryUuid)
    } else {
      console.log('CategoryId is empty or invalid, will omit from insert')
    }

    // Create the food
    const insertData: any = {
      hostId,
      name,
      slug,
      description: description || null,
      price: price.toString(),
      image: image || null,
      isVegetarian,
      preparationTime: preparationTime || null,
      isAvailable: true, // Explicitly set to ensure availability
    }

    // Only add categoryId if we have a valid UUID
    if (categoryUuid) {
      insertData.categoryId = categoryUuid
    }
    const newFood = await db.insert(Food).values(insertData).returning()

    return c.json(newFood[0], 201)
  } catch (error) {
    // console.error('Error creating food:', error)
    // Return more detailed error information
    return c.json(
      {
        error: 'Failed to create food',
        details: error instanceof Error ? error.message : String(error),
        status: 500,
      },
      500
    )
  }
})

// GET /api/foods/categories - Get all categories
routes.get('/categories', async (c: Context) => {
  try {
    const categories = await db
      .select({
        id: Category.id,
        name: Category.name,
        slug: Category.slug,
      })
      .from(Category)
      .where(eq(Category.isActive, true))
      .orderBy(Category.name)

    // Add "All Categories" option at the beginning
    const allCategories = [{ id: 'all', name: 'All Categories', slug: 'all' }, ...categories]

    return c.json(allCategories, 200)
  } catch (error) {
    console.error(
      'Error fetching categories:',
      error instanceof Error ? error.message : String(error)
    )
    return c.json({ error: 'Failed to fetch categories' }, 500)
  }
})

// GET /api/foods/my - Get foods for the authenticated user
routes.get('/my', authenticate, async (c: Context) => {
  try {
    const user = c.get('user')
    const hostId = user?.id

    if (!hostId) {
      return c.json({ error: 'User not authenticated' }, 401)
    }

    const foods = await db
      .select({
        id: Food.id,
        hostId: Food.hostId,
        name: Food.name,
        slug: Food.slug,
        description: Food.description,
        price: Food.price,
        image: Food.image,
        categoryId: Food.categoryId,
        ingredients: Food.ingredients,
        allergens: Food.allergens,
        preparationTime: Food.preparationTime,
        servingSize: Food.servingSize,
        isAvailable: Food.isAvailable,
        isVegetarian: Food.isVegetarian,
        isVegan: Food.isVegan,
        rating: Food.rating,
        totalRatings: Food.totalRatings,
        createdAt: Food.createdAt,
        updatedAt: Food.updatedAt,
      })
      .from(Food)
      .where(eq(Food.hostId, hostId))
      .orderBy(Food.createdAt)

    return c.json(foods, 200)
  } catch (error) {
    console.error(
      'Error fetching foods for host:',
      error instanceof Error ? error.message : String(error)
    )
    return c.json({ error: 'Failed to fetch foods' }, 500)
  }
})

// PUT /api/foods/:id - Update a food
routes.put('/:id', authenticate, async (c: Context) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    if (!id) {
      return c.json({ error: 'Food ID is required' }, 400)
    }

    const { name, description, price, categoryId, isVegetarian, preparationTime, image } = body

    // Check if food exists
    const existingFood = await db.select().from(Food).where(eq(Food.id, id)).limit(1)

    if (existingFood.length === 0) {
      return c.json({ error: 'Food not found' }, 404)
    }

    // If categoryId is provided, look up the category UUID from the slug
    let categoryUuid = undefined
    if (categoryId !== undefined) {
      if (categoryId && categoryId.trim()) {
        const category = await db
          .select()
          .from(Category)
          .where(eq(Category.slug, categoryId))
          .limit(1)
        if (category.length === 0) {
          return c.json({ error: 'Category not found' }, 404)
        }
        categoryUuid = category[0].id
      } else {
        categoryUuid = null // Explicitly set to null for empty category
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: sql`NOW()`,
    }

    if (name !== undefined) {
      updateData.name = name
      updateData.slug = generateSlug(name)
    }
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price.toString()
    if (categoryUuid !== undefined) updateData.categoryId = categoryUuid
    if (isVegetarian !== undefined) updateData.isVegetarian = isVegetarian
    if (preparationTime !== undefined) updateData.preparationTime = preparationTime
    if (image !== undefined) updateData.image = image

    // Update the food
    const updatedFood = await db.update(Food).set(updateData).where(eq(Food.id, id)).returning()

    return c.json(updatedFood[0], 200)
  } catch (error) {
    console.error('Error updating food:', error instanceof Error ? error.message : String(error))
    return c.json({ error: 'Failed to update food' }, 500)
  }
})

// PATCH /api/foods/:id/availability - Toggle food availability
routes.patch('/:id/availability', authenticate, async (c: Context) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    if (!id) {
      return c.json({ error: 'Food ID is required' }, 400)
    }

    const { isAvailable } = body

    if (typeof isAvailable !== 'boolean') {
      return c.json({ error: 'isAvailable must be a boolean' }, 400)
    }

    // Check if food exists
    const existingFood = await db.select().from(Food).where(eq(Food.id, id)).limit(1)

    if (existingFood.length === 0) {
      return c.json({ error: 'Food not found' }, 404)
    }

    // Update availability
    const updatedFood = await db
      .update(Food)
      .set({
        isAvailable,
        updatedAt: sql`NOW()`,
      })
      .where(eq(Food.id, id))
      .returning()

    return c.json(updatedFood[0], 200)
  } catch (error) {
    console.error(
      'Error updating food availability:',
      error instanceof Error ? error.message : String(error)
    )
    return c.json({ error: 'Failed to update food availability' }, 500)
  }
})

// GET /api/foods/:id - Get a specific food
routes.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')

    if (!id) {
      return c.json({ error: 'Food ID is required' }, 400)
    }

    const foods = await db.select().from(Food).where(eq(Food.id, id)).limit(1)

    if (foods.length === 0) {
      return c.json({ error: 'Food not found' }, 404)
    }

    return c.json(foods[0], 200)
  } catch (error) {
    console.error('Error fetching food:', error instanceof Error ? error.message : String(error))
    return c.json({ error: 'Failed to fetch food' }, 500)
  }
})
