import { listFoods, getFoodCategories } from '$lib/server/foods'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
  const searchParams = url.searchParams

  const filters = {
    search: searchParams.get('q') || undefined,
    category: searchParams.get('category') || 'all',
    vegetarian: searchParams.get('vegetarian') === 'true' ? true :
               searchParams.get('vegetarian') === 'false' ? false : undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20')
  }

  try {
    const [foodResult, categories] = await Promise.all([
      listFoods(filters),
      getFoodCategories()
    ])

    return {
      foods: foodResult.foods,
      categories,
      total: foodResult.total,
      currentPage: foodResult.page,
      pageSize: foodResult.pageSize,
      searchQuery: filters.search || '',
      selectedCategory: filters.category,
      selectedVegetarian: filters.vegetarian
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
      error: 'Failed to load foods'
    }
  }
}