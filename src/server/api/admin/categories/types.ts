import type { Category } from '../../../../server/db/schema'

export type CategoryWithDates = Omit<Category, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

export type CreateCategoryInput = {
  name: string
  slug?: string
  description?: string
  thumbnailUrl?: string
  parentId?: string
  type?: string
  metadata?: Record<string, unknown>
  isActive?: boolean
}

export type CategoryResponse = CategoryWithDates

export type ListCategoriesQuery = {
  page?: string
  q?: string
  sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc'
  page_size?: string
}

export type ListCategoriesResponse = {
  data: CategoryResponse[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type UniqueValuesResponse = {
}
