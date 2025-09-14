export interface ProductItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  host: {
    name: string
    rating: number
    location: string
  }
  category: string
  isVegetarian: boolean
  preparationTime: number
  rating: number
  totalRatings: number
}

export interface CategoryItem {
  id: string
  name: string
}

export interface ProductFilters {
  search?: string
  category?: string
  vegetarian?: boolean
  page?: number
  limit?: number
}

export interface ProductListResponse {
  foods: ProductItem[]
  categories: CategoryItem[]
  total: number
  page: number
  pageSize: number
}
