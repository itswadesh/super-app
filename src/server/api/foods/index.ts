import { and, eq, sql, like, or, desc } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { db } from '../../db'
import { Product, Category, User, Vendor } from '../../db/schema'
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
        or(like(Product.title, `%${search}%`), like(Product.description, `%${search}%`))
      )
    }

    if (category && category !== 'all') {
      whereConditions.push(eq(Product.categoryId, category))
    }

    if (vegetarian !== undefined) {
      const isVeg = vegetarian === 'true'
      whereConditions.push(eq(Product.isVegetarian, isVeg))
    }

    whereConditions.push(eq(Product.isAvailable, true))
    whereConditions.push(eq(Vendor.status, 'approved'))

    // // Debug: Check approved vendors
    // const approvedVendors = await db
    //   .select({
    //     id: Vendor.id,
    //     userId: Vendor.userId,
    //     status: Vendor.status,
    //     fullName: Vendor.fullName,
    //   })
    //   .from(Vendor)
    //   .where(eq(Vendor.status, 'approved'))
    // console.log('Approved vendors:', approvedVendors)

    // // Debug: Check all foods
    // const allFoods = await db
    //   .select({
    //     id: Product.id,
    //     name: Product.name,
    //     hostId: Product.hostId,
    //     isAvailable: Product.isAvailable,
    //   })
    //   .from(Product)
    //   .limit(50)
    // console.log('All foods in database:', allFoods)

    // // Debug: Check foods with vendor join
    // const foodsWithVendors = await db
    //   .select({
    //     foodId: Product.id,
    //     foodName: Product.name,
    //     hostId: Product.hostId,
    //     isAvailable: Product.isAvailable,
    //     vendorId: Vendor.id,
    //     vendorUserId: Vendor.userId,
    //     vendorStatus: Vendor.status,
    //     vendorName: Vendor.fullName,
    //   })
    //   .from(Product)
    //   .leftJoin(Vendor, eq(Product.hostId, Vendor.userId))
    //   .limit(50)
    // console.log('Foods with vendor join:', foodsWithVendors)

    // // Debug: Check if approved vendors have foods
    // if (approvedVendors.length > 0) {
    //   for (const vendor of approvedVendors) {
    //     const vendorFoods = await db
    //       .select({
    //         id: Product.id,
    //         name: Product.name,
    //         hostId: Product.hostId,
    //         isAvailable: Product.isAvailable,
    //       })
    //       .from(Product)
    //       .where(eq(Product.hostId, vendor.userId))
    //     console.log(`Foods for vendor ${vendor.fullName} (${vendor.userId}):`, vendorFoods)
    //   }
    // }

    const foods = await db
      .select({
        id: Product.id,
        name: Product.title,
        description: Product.description,
        price: Product.price,
        image: Product.image,
        categoryId: Product.categoryId,
        isVegetarian: Product.isVegetarian,
        preparationTime: Product.preparationTime,
        rating: Product.rating,
        totalRatings: Product.totalRatings,
        hostId: Product.hostId,
        hostName: Vendor.businessName,
        hostCity: Vendor.city,
        categoryName: Category.name,
      })
      .from(Product)
      .leftJoin(User, eq(Product.hostId, User.id))
      .leftJoin(Vendor, eq(Product.hostId, Vendor.userId))
      .leftJoin(Category, eq(Product.categoryId, Category.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(Product.createdAt))
      .limit(limit)
      .offset(offset)

    // console.log('Filtered foods result:', foods)

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
        rating: 0,
      },
    }))

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(Product)
      .leftJoin(User, eq(Product.hostId, User.id))
      .leftJoin(Vendor, eq(Product.hostId, Vendor.userId))
      .leftJoin(Category, eq(Product.categoryId, Category.id))
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
    const existingFood = await db.select().from(Product).where(eq(Product.slug, slug)).limit(1)

    if (existingFood.length > 0) {
      return c.json({ error: 'Product with this name already exists' }, 409)
    }

    // If categoryId is provided, look up the category UUID from the slug
    let categoryUuid = undefined

    // Log available categories for debugging
    const availableCategories = await db
      .select({ id: Category.id, name: Category.name, slug: Category.slug })
      .from(Category)
      .where(eq(Category.isActive, true))
      .limit(10)
    console.log('📋 DEBUG: Available categories:', availableCategories)

    if (categoryId && typeof categoryId === 'string' && categoryId.trim().length > 0) {
      console.log('✅ DEBUG: CategoryId is valid, looking up UUID for slug:', categoryId)
      const category = await db
        .select()
        .from(Category)
        .where(eq(Category.slug, categoryId))
        .limit(1)
      console.log('🔎 DEBUG: Category lookup result:', category)
      if (category.length === 0) {
        console.log('❌ DEBUG: Category not found for slug:', categoryId)
        return c.json({ error: 'Category not found' }, 404)
      }
      categoryUuid = category[0].id
      console.log('🎯 DEBUG: Found category UUID:', categoryUuid)
    } else {
      console.log('ℹ️  INFO: No category selected (optional), proceeding without category')
    }

    // Create the food
    const insertData: any = {
      hostId,
      title: name,
      titleEnglish: name,
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
    const newFood = await db.insert(Product).values(insertData).returning()

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

    // console.log('Debug: hostId:', hostId)
    // console.log('Debug: Product.title exists:', !!Product.title)

    const foods = await db
      .select({
        id: Product.id,
        hostId: Product.hostId,
        name: Product.title,
        slug: Product.slug,
        description: Product.description,
        price: Product.price,
        image: Product.image,
        categoryId: Product.categoryId,
        ingredients: Product.ingredients,
        allergens: Product.allergens,
        preparationTime: Product.preparationTime,
        servingSize: Product.servingSize,
        isAvailable: Product.isAvailable,
        isVegetarian: Product.isVegetarian,
        isVegan: Product.isVegan,
        rating: Product.rating,
        totalRatings: Product.totalRatings,
        createdAt: Product.createdAt,
        updatedAt: Product.updatedAt,
      })
      .from(Product)
      .where(eq(Product.hostId, hostId))
      .orderBy(Product.createdAt)

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
      return c.json({ error: 'Product ID is required' }, 400)
    }

    const { name, description, price, categoryId, isVegetarian, preparationTime, image } = body

    // Check if food exists
    const existingFood = await db.select().from(Product).where(eq(Product.id, id)).limit(1)

    if (existingFood.length === 0) {
      return c.json({ error: 'Product not found' }, 404)
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
        console.log('ℹ️  INFO: No category selected (optional), setting categoryId to null')
        categoryUuid = null // Explicitly set to null for empty category
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: sql`NOW()`,
    }

    if (name !== undefined) {
      updateData.title = name
      updateData.titleEnglish = name
      updateData.slug = generateSlug(name)
    }
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price.toString()
    if (categoryUuid !== undefined) updateData.categoryId = categoryUuid
    if (isVegetarian !== undefined) updateData.isVegetarian = isVegetarian
    if (preparationTime !== undefined) updateData.preparationTime = preparationTime
    if (image !== undefined) updateData.image = image

    // Update the food
    const updatedFood = await db
      .update(Product)
      .set(updateData)
      .where(eq(Product.id, id))
      .returning()

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
      return c.json({ error: 'Product ID is required' }, 400)
    }

    const { isAvailable } = body

    if (typeof isAvailable !== 'boolean') {
      return c.json({ error: 'isAvailable must be a boolean' }, 400)
    }

    // Check if food exists
    const existingFood = await db.select().from(Product).where(eq(Product.id, id)).limit(1)

    if (existingFood.length === 0) {
      return c.json({ error: 'Product not found' }, 404)
    }

    // Update availability
    const updatedFood = await db
      .update(Product)
      .set({
        isAvailable,
        updatedAt: sql`NOW()`,
      })
      .where(eq(Product.id, id))
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
      return c.json({ error: 'Product ID is required' }, 400)
    }

    const foods = await db.select().from(Product).where(eq(Product.id, id)).limit(1)

    if (foods.length === 0) {
      return c.json({ error: 'Product not found' }, 404)
    }

    return c.json(foods[0], 200)
  } catch (error) {
    console.error('Error fetching food:', error instanceof Error ? error.message : String(error))
    return c.json({ error: 'Failed to fetch food' }, 500)
  }
})
