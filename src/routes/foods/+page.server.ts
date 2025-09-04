import { and, desc, eq, like, or, sql } from 'drizzle-orm'
import { db } from '../../server/db'
import { Category, Food, HostProfile, User } from '../../server/db/schema'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
  const searchParams = url.searchParams

  const filters = {
    search: searchParams.get('q') || undefined,
    category: searchParams.get('category') || 'all',
    vegetarian:
      searchParams.get('vegetarian') === 'true'
        ? true
        : searchParams.get('vegetarian') === 'false'
          ? false
          : undefined,
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '20', 10),
  }

  try {
    // Build where conditions
    const whereConditions = []

    if (filters.search) {
      whereConditions.push(
        or(like(Food.name, `%${filters.search}%`), like(Food.description, `%${filters.search}%`))
      )
    }

    if (filters.category && filters.category !== 'all') {
      whereConditions.push(eq(Food.categoryId, filters.category))
    }

    if (filters.vegetarian !== undefined) {
      whereConditions.push(eq(Food.isVegetarian, filters.vegetarian))
    }

    whereConditions.push(eq(Food.isAvailable, true))

    // Calculate offset
    const offset = (filters.page - 1) * filters.limit

    // Get foods with joins
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
        hostLocation: HostProfile.location,
        hostRating: HostProfile.rating,
        categoryName: Category.name,
      })
      .from(Food)
      .leftJoin(User, eq(Food.hostId, User.id))
      .leftJoin(HostProfile, eq(Food.hostId, HostProfile.userId))
      .leftJoin(Category, eq(Food.categoryId, Category.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(Food.createdAt))
      .limit(filters.limit)
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
      host: {
        name: food.hostName || 'Unknown Host',
        rating: food.hostRating ? parseFloat(food.hostRating) : 0,
        location: food.hostLocation || 'Unknown Location',
      },
    }))

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(Food)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

    const total = totalResult[0]?.count || 0

    // Get categories
    const categoriesData = await db
      .select({
        id: Category.id,
        name: Category.name,
        slug: Category.slug,
      })
      .from(Category)
      .where(eq(Category.isActive, true))

    const categories = [{ id: 'all', name: 'All Categories' }, ...categoriesData]

    return {
      foods: transformedFoods,
      categories,
      total,
      currentPage: filters.page,
      pageSize: filters.limit,
      searchQuery: filters.search || '',
      selectedCategory: filters.category,
      selectedVegetarian: filters.vegetarian,
    }
  } catch (error) {
    console.error('Error loading foods:', error)
    return {
      foods: [],
      categories: [],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      searchQuery: '',
      selectedCategory: 'all',
      selectedVegetarian: undefined,
      error: 'Failed to load foods',
    }
  }
}
