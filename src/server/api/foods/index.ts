import { and, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { db } from '../../db'
import { Food, Category, User } from '../../db/schema'

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

// POST /api/foods - Create a new food
routes.post('/', async (c: Context) => {
  console.log('Received request body:......................', c.req.user)
  try {
    const body = await c.req.json()
    const hostId = c.req.user?.id
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
    // console.log('Checking categoryId condition:', {
    //   categoryId,
    //   isEmptyString: categoryId === '',
    //   trimmed: categoryId?.trim(),
    //   isTruthy: !!categoryId,
    //   trimTruthy: !!categoryId?.trim(),
    // })

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
    console.error('Error fetching categories:', error)
    return c.json({ error: 'Failed to fetch categories' }, 500)
  }
})

// GET /api/foods/host/:hostId - Get foods for a specific host
routes.get('/my', async (c: Context) => {
  try {
    const hostId = c.req.param('hostId')

    if (!hostId) {
      return c.json({ error: 'Host ID is required' }, 400)
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
    console.error('Error fetching foods for host:', error)
    return c.json({ error: 'Failed to fetch foods' }, 500)
  }
})

// PUT /api/foods/:id - Update a food
routes.put('/:id', async (c: Context) => {
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
    console.error('Error updating food:', error)
    return c.json({ error: 'Failed to update food' }, 500)
  }
})

// PATCH /api/foods/:id/availability - Toggle food availability
routes.patch('/:id/availability', async (c: Context) => {
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
    console.error('Error updating food availability:', error)
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
    console.error('Error fetching food:', error)
    return c.json({ error: 'Failed to fetch food' }, 500)
  }
})
