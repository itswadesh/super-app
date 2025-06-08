/**
 * Product service for handling API calls related to videos, notes, and quizzes
 */
import { authorService } from './author-service'

/**
 * Author interface (internal to product service)
 */
export interface Author {
  id: string
  name: string
  email?: string
  bio?: string
  avatar?: string
  role?: string
}

/**
 * Base product interface
 */
export interface BaseProduct {
  id: string
  title: string
  description: string
  thumbnail?: string
  createdAt: string
  updatedAt: string
  authorId: string
  categoryId: string
  slug: string
}

/**
 * Product with author interface
 */
export interface ProductWithAuthor extends BaseProduct {
  author?: Author
}

/**
 * Video interface
 */
export interface Video extends BaseProduct {
  duration: number
  videoUrl: string
  views: number
}

/**
 * Note interface
 */
export interface Note extends BaseProduct {
  product: string
  pdfUrl?: string
}

/**
 * Quiz interface
 */
export interface Quiz extends BaseProduct {
  questions: number
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit?: number
}

/**
 * Pagination parameters interface
 */
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeAuthor?: boolean
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Product Service for making product-related API calls
 */
/**
 * Get author details for product
 * @deprecated Use authorService.getAuthorDetails() instead
 */
export async function fetchProductAuthor(authorId: string): Promise<Author | null> {
  return authorService.getAuthorDetails(authorId) as unknown as Author | null
}

export const productService = {
  /**
   * Get products with pagination and filtering
   * @param params Pagination parameters including includeAuthor option
   */
  async list(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<BaseProduct & { author?: Author }>> {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
      const response = await fetch(`/api/products?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to load products')
      }

      const result = await response.json()

      return result
    } catch (error) {
      console.error('Error fetching products:', error)
      throw new Error('Failed to load products. Please try again.')
    }
  },

  /**
   * Get a single product by ID or slug
   */
  async get({
    idOrSlug,
    fetch,
  }: { idOrSlug: string; fetch?: boolean }): Promise<BaseProduct & { author?: Author }> {
    try {
      const queryParams = new URLSearchParams()
      if (fetch) {
        queryParams.append('fetch', 'true')
      }

      const response = await fetch(`/api/products/${idOrSlug}`)

      if (!response.ok) {
        throw new Error('Failed to load product')
      }

      const data = await response.json()

      return data
    } catch (error) {
      console.error('Error fetching product:', error)
      throw new Error('Failed to load product. Please try again.')
    }
  },

  /**
   * Get quizzes with pagination and filtering
   * @param params Pagination parameters including includeAuthor option
   */
  async getQuizzes(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Quiz & { author?: Author }>> {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/quiz?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to load quizzes')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching quizzes:', error)
      throw new Error('Failed to load quizzes. Please try again.')
    }
  },

  /**
   * Get a single quiz by ID or slug
   */
  async getQuiz(
    idOrSlug: string,
    { includeAuthor = true, fetch = true }: { includeAuthor?: boolean; fetch?: boolean }
  ): Promise<Quiz & { author?: Author }> {
    try {
      const queryParams = new URLSearchParams()
      if (includeAuthor) {
        queryParams.append('includeAuthor', 'true')
      }

      const response = await fetch(`/api/quiz/${idOrSlug}?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to load quiz')
      }

      const data = await response.json()
      return data.quiz || data // Handle both { quiz } and direct quiz response
    } catch (error) {
      console.error('Error fetching quiz:', error)
      throw new Error('Failed to load quiz. Please try again.')
    }
  },

  /**
   * Create a new quiz attempt
   */
  async createQuizAttempt(data: { quizId: string; userId: string }): Promise<any> {
    try {
      const response = await fetch('/api/quiz/attempt', {
        method: 'POST',
        headers: {
          'Product-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Ensure cookies are sent with the request
      })

      return response
    } catch (error) {
      console.error('Error creating quiz attempt:', error)
      throw new Error('Failed to start quiz. Please try again.')
    }
  },

  /**
   * Update an existing quiz attempt
   */
  async updateQuizAttempt(data: {
    attemptId: string
    answers?: any
    notes?: any
    status?: string
    timeSpent?: number
    complete?: boolean
  }): Promise<any> {
    try {
      const response = await fetch('/api/quiz/attempt', {
        method: 'PUT',
        headers: {
          'Product-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      return response
    } catch (error) {
      console.error('Error updating quiz attempt:', error)
      throw new Error('Failed to update quiz progress. Please try again.')
    }
  },

  /**
   * Complete a quiz attempt
   */
  async completeQuizAttempt(data: {
    attemptId: string
    status: string
    timeSpent: number
  }): Promise<any> {
    try {
      const response = await fetch('/api/quiz/attempt', {
        method: 'PATCH',
        headers: {
          'Product-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          complete: true,
        }),
        credentials: 'include',
      })

      return response
    } catch (error) {
      console.error('Error completing quiz attempt:', error)
      throw new Error('Failed to submit quiz. Please try again.')
    }
  },

  /**
   * Update a quiz attempt status (e.g. abandon)
   */
  async updateQuizAttemptStatus(data: {
    attemptId: string
    status: string
    timeSpent: number
  }): Promise<any> {
    try {
      const response = await fetch('/api/quiz/attempt', {
        method: 'PATCH',
        headers: {
          'Product-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      return response
    } catch (error) {
      console.error('Error updating quiz attempt status:', error)
      throw new Error('Failed to update quiz status. Please try again.')
    }
  },

  /**
   * Get a resource by type and ID (for download page)
   */
  async getResourceById(resourceType: string, resourceId: string): Promise<any> {
    try {
      const response = await fetch(`/api/${resourceType}/${resourceId}`)
      return response
    } catch (error) {
      console.error(`Error fetching ${resourceType} with ID ${resourceId}:`, error)
      throw new Error(`Failed to load ${resourceType}. Please try again.`)
    }
  },

  /**
   * Get product by type with filtering (for FilteredProduct component)
   */
  async getProductByType(
    productType: 'video' | 'note' | 'quiz',
    queryParams: URLSearchParams
  ): Promise<any> {
    try {
      const response = await fetch(`/api/${productType}?${queryParams.toString()}`)
      return response
    } catch (error) {
      console.error(`Error fetching ${productType} product:`, error)
      throw new Error(`Failed to load ${productType} product. Please try again.`)
    }
  },

  /**
   * Get quiz questions by quiz ID
   */
  async getQuizQuestions(quizId: string): Promise<any> {
    try {
      const response = await fetch(`/api/quiz/${quizId}/questions`)
      if (!response.ok) {
        throw new Error('Failed to load quiz questions')
      }
      const data = await response.json()
      return data.questions || []
    } catch (error) {
      console.error(`Error fetching questions for quiz ${quizId}:`, error)
      throw new Error('Failed to load quiz questions. Please try again.')
    }
  },

  /**
   * Save quiz questions
   */
  async saveQuizQuestions(quizId: string, questions: any[]): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/quiz/${quizId}/questions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions }),
      })

      if (!response.ok) {
        throw new Error('Failed to save quiz questions')
      }

      return { success: true }
    } catch (error) {
      console.error(`Error saving questions for quiz ${quizId}:`, error)
      throw new Error('Failed to save quiz questions. Please try again.')
    }
  },

  /**
   * Get filtered videos for admin page
   */
  async getFilteredVideos(url: string): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: {
          'X-Requested-With': 'fetch',
        },
      })
      return response
    } catch (error) {
      console.error('Error fetching filtered videos:', error)
      throw new Error('Failed to load videos. Please try again.')
    }
  },

  /**
   * Get YouTube metadata by video ID
   */
  async getYoutubeMetadata(youtubeId: string): Promise<any> {
    try {
      const response = await fetch(`/api/youtube-metadata?id=${youtubeId}`)
      return response
    } catch (error) {
      console.error('Error fetching YouTube metadata:', error)
      throw new Error('Failed to load YouTube metadata. Please try again.')
    }
  },

  /**
   * Create a new video
   */
  async createVideo(
    payload: Record<string, string | File | FormDataEntryValue>
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create video')
      }

      return { success: true, message: data.message }
    } catch (error) {
      console.error('Error creating video:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create video',
      }
    }
  },

  /**
   * Update an existing video
   */
  async saveVideo(
    id: string,
    payload: Record<string, string | File | FormDataEntryValue>
  ): Promise<{ success: boolean; status?: number; message?: string }> {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.message || 'Failed to update video',
        }
      }

      return { success: true, message: data.message }
    } catch (error) {
      console.error('Error updating video:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update video',
      }
    }
  },

  /**
   * Delete a video
   */
  async deleteVideo(id: string): Promise<{ success: boolean; status?: number; message?: string }> {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.message || 'Failed to delete video',
        }
      }

      return { success: true, message: data.message }
    } catch (error) {
      console.error('Error deleting video:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete video',
      }
    }
  },
}
