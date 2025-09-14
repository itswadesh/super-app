import type {
  ProductItem,
  CategoryItem,
  ProductFilters,
  ProductListResponse,
} from '$lib/types/food'

// Mock data - replace with actual database queries
const mockFoods: ProductItem[] = [
  {
    id: '1',
    name: 'Homemade Butter Chicken',
    description: 'Authentic Indian butter chicken made with fresh ingredients',
    price: 250,
    image: '/api/placeholder/300/200',
    host: {
      name: 'Priya Sharma',
      rating: 4.8,
      location: 'Mumbai',
    },
    category: 'Indian',
    isVegetarian: false,
    preparationTime: 30,
    rating: 4.5,
    totalRatings: 24,
  },
  {
    id: '2',
    name: 'Fresh Vegetable Biryani',
    description: 'Aromatic basmati rice with seasonal vegetables and spices',
    price: 180,
    image: '/api/placeholder/300/200',
    host: {
      name: 'Ahmed Khan',
      rating: 4.9,
      location: 'Delhi',
    },
    category: 'Indian',
    isVegetarian: true,
    preparationTime: 45,
    rating: 4.7,
    totalRatings: 31,
  },
  {
    id: '3',
    name: 'Italian Pasta Carbonara',
    description: 'Creamy pasta with pancetta, eggs, and parmesan cheese',
    price: 220,
    image: '/api/placeholder/300/200',
    host: {
      name: 'Maria Rossi',
      rating: 4.6,
      location: 'Bangalore',
    },
    category: 'Italian',
    isVegetarian: false,
    preparationTime: 25,
    rating: 4.3,
    totalRatings: 18,
  },
  {
    id: '4',
    name: 'Paneer Tikka Masala',
    description: 'Spicy and tangy paneer tikka in rich tomato gravy',
    price: 200,
    image: '/api/placeholder/300/200',
    host: {
      name: 'Rajesh Kumar',
      rating: 4.7,
      location: 'Pune',
    },
    category: 'Indian',
    isVegetarian: true,
    preparationTime: 35,
    rating: 4.6,
    totalRatings: 42,
  },
  {
    id: '5',
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with fresh mozzarella and basil',
    price: 280,
    image: '/api/placeholder/300/200',
    host: {
      name: 'Giovanni Bianchi',
      rating: 4.5,
      location: 'Hyderabad',
    },
    category: 'Italian',
    isVegetarian: true,
    preparationTime: 20,
    rating: 4.4,
    totalRatings: 27,
  },
]

const mockCategories: CategoryItem[] = [
  { id: 'all', name: 'All Categories' },
  { id: 'indian', name: 'Indian' },
  { id: 'italian', name: 'Italian' },
  { id: 'chinese', name: 'Chinese' },
  { id: 'mexican', name: 'Mexican' },
]

export async function getFoodCategories(): Promise<CategoryItem[]> {
  // TODO: Replace with actual database query
  // const categories = await db.select().from(categoriesTable)
  return mockCategories
}

export async function listFoods(filters: ProductFilters = {}): Promise<ProductListResponse> {
  const { search = '', category = 'all', vegetarian, page = 1, limit = 20 } = filters

  let filteredFoods = [...mockFoods]

  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase()
    filteredFoods = filteredFoods.filter(
      (food) =>
        food.name.toLowerCase().includes(searchLower) ||
        food.description.toLowerCase().includes(searchLower)
    )
  }

  // Apply category filter
  if (category && category !== 'all') {
    filteredFoods = filteredFoods.filter(
      (food) => food.category.toLowerCase() === category.toLowerCase()
    )
  }

  // Apply vegetarian filter
  if (vegetarian !== undefined) {
    filteredFoods = filteredFoods.filter((food) => food.isVegetarian === vegetarian)
  }

  // Apply pagination
  const total = filteredFoods.length
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedFoods = filteredFoods.slice(startIndex, endIndex)

  return {
    foods: paginatedFoods,
    categories: mockCategories,
    total,
    page,
    pageSize: limit,
  }
}

export async function getFoodById(id: string): Promise<ProductItem | null> {
  // TODO: Replace with actual database query
  // const food = await db.select().from(foodsTable).where(eq(foodsTable.id, id)).limit(1)
  return mockFoods.find((food) => food.id === id) || null
}
