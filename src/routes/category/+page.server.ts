import { categoryService } from '$lib/services/category-service'
import type { PageServerLoad } from './$types'

// Define interfaces for better type safety
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  type: string | null
  rank: number
  count: number
  children?: Category[]
}

export const load = (async ({ url }) => {
  // Extract query parameters
  const search = url.searchParams.get('search') || ''
  const page = Number.parseInt(url.searchParams.get('page') || '1')
  const limit = Number.parseInt(url.searchParams.get('limit') || '50') // Higher limit for categories

  try {
    // Fetch all categories from database
    const categoryResults = await categoryService.getAllCategories()
    // Apply search filter if needed
    let filteredCategories = categoryResults
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCategories = categoryResults.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchLower) ||
          (cat.description?.toLowerCase() || '').includes(searchLower)
      )
    }

    // Apply pagination
    const totalCategories = filteredCategories.length
    const totalPages = Math.ceil(totalCategories / limit)
    const offset = (page - 1) * limit
    const paginatedCategories = filteredCategories.slice(offset, offset + limit)

    return {
      categories: paginatedCategories,
      allCategories: categoryResults, // Used for parent selection
      pagination: {
        totalItems: totalCategories,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
      },
      filters: {
        search: search,
      },
    }
  } catch (error) {
    console.error('Error loading categories:', error)
    return {
      categories: [],
      allCategories: [],
      pagination: {
        totalItems: 0,
        itemsPerPage: limit,
        currentPage: 1,
        totalPages: 0,
      },
      filters: {
        search: '',
      },
      error: true,
    }
  }
}) satisfies PageServerLoad

// Define actions for category management
export const actions = {
  createCategory: async ({ request }) => {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    const parentId = (formData.get('parentId') as string) || null

    if (!name || !slug) {
      return { success: false, message: 'Name and slug are required.' }
    }

    try {
      const result = await categoryService.createCategory({
        name,
        slug,
        description,
        type,
        parentId,
        rank: 0,
        count: 0,
      })

      return { success: true, message: 'Category created successfully' }
    } catch (error) {
      console.error('Error creating category:', error)
      return { success: false, message: 'Failed to create category.' }
    }
  },

  updateCategory: async ({ request }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    const parentId = (formData.get('parentId') as string) || null

    if (!id || !name || !slug) {
      return { success: false, message: 'ID, name, and slug are required.' }
    }

    try {
      await categoryService.updateCategory({
        id,
        name,
        slug,
        description,
        type,
        parentId,
      })

      return { success: true, message: 'Category updated successfully' }
    } catch (error) {
      console.error('Error updating category:', error)
      return { success: false, message: 'Failed to update category.' }
    }
  },

  deleteCategory: async ({ request }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return { success: false, message: 'Category ID is required.' }
    }

    try {
      // Check if category has children
      const childCategories = await categoryService.getAllCategories()

      if (childCategories.length > 0) {
        return {
          success: false,
          message: 'Cannot delete category with subcategories. Delete subcategories first.',
        }
      }

      await categoryService.deleteCategory(id)

      return { success: true, message: 'Category deleted successfully' }
    } catch (error) {
      console.error('Error deleting category:', error)
      return { success: false, message: 'Failed to delete category.' }
    }
  },
}
