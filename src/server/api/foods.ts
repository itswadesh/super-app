import { Hono } from 'hono'
import { db } from '../db'
import { Food, Category } from '../db/schema'
import { eq, and, like, or } from 'drizzle-orm'

export const routes = new Hono()

// Get all foods with optional filtering
export const getFoods = async ({
  search,
  category,
  vegetarian,
  limit = 20,
  offset = 0
}: {
  search?: string
  category?: string
  vegetarian?: boolean
  limit?: number
  offset?: number
}) => {
  let whereConditions = []

  if (search) {
    whereConditions.push(
      or(
        like(Food.name, `%${search}%`),
        like(Food.description, `%${search}%`)
      )
    )
  }

  if (category) {
    whereConditions.push(eq(Food.categoryId, category))
  }

  if (vegetarian !== undefined) {
    whereConditions.push(eq(Food.isVegetarian, vegetarian))
  }

  whereConditions.push(eq(Food.isAvailable, true))

  const foods = await db
    .select()
    .from(Food)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .limit(limit)
    .offset(offset)

  // For now, return foods without host information
  // TODO: Add proper joins with User and HostProfile tables
  return foods.map(food => ({
    ...food,
    host: {
      name: 'Host Name', // TODO: Join with User table
      rating: 4.5, // TODO: Calculate from HostProfile
      location: 'Location' // TODO: Get from HostProfile
    }
  }))

  return foods
}

// Get food by ID
export const getFoodById = async (id: string) => {
  const foods = await db
    .select()
    .from(Food)
    .where(eq(Food.id, id))

  return foods.at(0)
}

// Get categories
export const getCategories = async () => {
  const categories = await db
    .select()
    .from(Category)
    .where(eq(Category.isActive, true))

  return categories
}