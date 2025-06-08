import { httpClient, createQueryParams } from './http-client'
import { errorService } from './error-service'

/**
 * Interface for Author data
 */
export interface Author {
  id: string
  name: string
  avatar?: string
  bio: string
  qualifications: string[]
  achievements: string[]
  joinedDate: string
  socialLinks?: {
    website?: string
    twitter?: string
    linkedin?: string
  }
}

/**
 * Interface for content statistics
 */
export interface ContentStats {
  videos: number
  notes: number
  quizzes: number
}

/**
 * Interface for author response
 */
interface AuthorResponse {
  author: Author
  stats: ContentStats
}

/**
 * Interface for author content filters
 */
export interface AuthorContentFilters extends Record<string, string | number | boolean | undefined> {
  contentType?: 'video' | 'note' | 'quiz' | 'all'
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Base content item interface for author content
 */
interface BaseContentItem {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  authorId: string
  categoryId: string
  slug: string
}

/**
 * Interface for paged author content response
 */
export interface AuthorContentResponse<T = BaseContentItem> {
  items: T[]
  total: number
  page: number
  totalPages: number
  contentType: string
}

export const authorService = {
  /**
   * Get author by ID
   */
  getAuthorById(id: string): Promise<AuthorResponse> {
    return httpClient.get<AuthorResponse>(`/api/authors/${id}`)
      .catch((error) => {
        console.error('Error fetching author data:', error)
        throw new Error('Failed to load author information. Please try again.')
      })
  },

  /**
   * Get all authors
   */
  async getAllAuthors(includeStats = false): Promise<Author[]> {
    const queryParams = createQueryParams({
      includeStats: includeStats ? 'true' : undefined
    })

    return httpClient.get<{ authors: Author[] }>(`/api/authors?${queryParams}`)
      .then(data => data.authors)
      .catch((error) => {
        console.error('Error fetching authors:', error)
        throw new Error('Failed to load authors. Please try again.')
      })
  },

  /**
   * Get author content (videos, notes, quizzes) by author ID
   * @param authorId Author ID
   * @param filters Optional filters for content type, pagination, etc
   */
  getAuthorContent<T = BaseContentItem>(
    authorId: string,
    filters: AuthorContentFilters = {}
  ): Promise<AuthorContentResponse<T>> {
    const queryParams = createQueryParams(filters)

    return httpClient.get<AuthorContentResponse<T>>(
      `/api/authors/${authorId}/content?${queryParams}`
    ).catch((error) => {
      errorService.logError('API Error', 'Failed to fetch author content', error)
      console.error('Error fetching author content:', error)
      throw new Error('Failed to load author content. Please try again.')
    })
  },

  /**
   * Get simplified author details by ID (for embedding in content objects)
   */
  getAuthorDetails(authorId: string): Promise<Pick<Author, 'id' | 'name' | 'avatar'>> {
    return httpClient.get<{ author: Pick<Author, 'id' | 'name' | 'avatar'> }>(`/api/authors/${authorId}/details`)
      .then(data => data.author)
      .catch((error) => {
        errorService.logError('API Error', 'Failed to fetch author details', error)
        console.error('Error fetching author details:', error)
        return { id: authorId, name: 'Unknown Author' }
      })
  },

  /**
   * Check if a user is an author
   */
  isUserAuthor(userId: string): Promise<boolean> {
    return httpClient.get<{ isAuthor: boolean }>(`/api/authors/check/${userId}`)
      .then(data => data.isAuthor)
      .catch((error) => {
        console.error('Error checking author status:', error)
        return false
      })
  },
}
