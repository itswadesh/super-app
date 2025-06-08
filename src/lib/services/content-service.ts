/**
 * Content service for handling API calls related to videos, notes, and quizzes
 */
import { type Author as AuthorType, authorService } from './author-service'
import { httpClient, createQueryParams } from './http-client'

// Define User type locally to avoid circular dependencies
interface User {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
}

// Local type definitions to avoid circular dependencies

/**
 * Author interface (internal to content service)
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
 * Base content interface
 */
export interface BaseContent {
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
 * Content with author interface
 */
export interface ContentWithAuthor extends BaseContent {
  author?: Author
}

/**
 * Video interface
 */
export interface Video extends BaseContent {
  duration: number
  videoUrl: string
  views: number
}

/**
 * Note interface
 */
export interface Note extends BaseContent {
  content: string
  pdfUrl?: string
}

/**
 * Quiz interface
 */
export interface Quiz extends BaseContent {
  questions: number | Array<Record<string, unknown>>
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit?: number
}

/**
 * Pagination parameters interface
 */
export interface PaginationParams extends Record<string, string | number | boolean | undefined> {
  page?: number
  limit?: number
  pageSize?: number
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
  pagination?: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

/**
 * Content Service for making content-related API calls
 */
/**
 * Get author details for content
 * @deprecated Use authorService.getAuthorDetails() instead
 */
export async function fetchContentAuthor(authorId: string): Promise<Author | null> {
  return authorService.getAuthorDetails(authorId) as unknown as Author | null
}

/**
 * Helper function to enrich content items with author information
 * @param items Array of content items with authorId property
 */
async function _enrichContentWithAuthors<T extends { authorId?: string; author?: Author }>(
  items: Array<T>
): Promise<void> {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return
  }

  // Collect unique author IDs
  const authorIds = new Set<string>()
  for (const item of items) {
    if (item.authorId && !item.author) {
      authorIds.add(item.authorId)
    }
  }

  // If no authors to fetch, return early
  if (authorIds.size === 0) {
    return
  }

  // Pre-fetch all needed authors in parallel
  const authorMap = new Map<string, Author>()
  await Promise.all(
    Array.from(authorIds).map(async (authorId) => {
      try {
        const author = await authorService.getAuthorDetails(authorId)
        authorMap.set(authorId, author)
      } catch (err) {
        console.error(`Failed to fetch author ${authorId}:`, err)
      }
    })
  )

  // Enrich items with author information
  for (const item of items) {
    if (item.authorId && !item.author) {
      const author = authorMap.get(item.authorId)
      if (author) {
        item.author = author
      }
    }
  }
}

export const contentService = {
  /**
   * Get videos with pagination and filtering
   */
  async getVideos(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Video & { author?: Author }>> {
    const queryParams = createQueryParams(params)

    return httpClient
      .get<PaginatedResponse<Video & { author?: Author }>>(`/api/videos?${queryParams}`)
      .then(async (result) => {
        // Enrich videos with author information if requested
        if (params.includeAuthor && result.data && Array.isArray(result.data)) {
          await _enrichContentWithAuthors(result.data)
        }
        return result
      })
      .catch((error) => {
        console.error('Error fetching videos:', error)
        throw new Error('Failed to load videos. Please try again.')
      })
  },

  /**
   * Get a single video by ID or slug
   */
  async getVideo(idOrSlug: string, includeAuthor = true): Promise<Video & { author?: Author }> {
    const queryParams = createQueryParams({
      includeAuthor: includeAuthor ? 'true' : undefined,
    })

    return httpClient
      .get<{ video: Video & { author?: Author } }>(`/api/videos/${idOrSlug}?${queryParams}`)
      .then(async (data) => {
        const video = data.video

        // Enrich with author information if requested
        if (includeAuthor && video?.authorId && !video.author) {
          video.author = await authorService.getAuthorDetails(video.authorId)
        }

        return video
      })
      .catch((error) => {
        console.error('Error fetching video:', error)
        throw new Error('Failed to load video. Please try again.')
      })
  },

  /**
   * Get notes with pagination and filtering
   * @param params Pagination parameters including includeAuthor option
   */
  async getNotes(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Note & { author?: Author }>> {
    const queryParams = createQueryParams(params)

    return httpClient
      .get<PaginatedResponse<Note & { author?: Author }>>(`/api/notes?${queryParams}`)
      .then(async (result) => {
        // Enrich notes with author information if requested
        if (params.includeAuthor && result.data && Array.isArray(result.data)) {
          await _enrichContentWithAuthors(result.data)
        }
        return result
      })
      .catch((error) => {
        console.error('Error fetching notes:', error)
        throw new Error('Failed to load notes. Please try again.')
      })
  },

  /**
   * Get a single note by ID or slug
   */
  async getNote(idOrSlug: string, includeAuthor = true): Promise<Note & { author?: Author }> {
    const queryParams = createQueryParams({
      includeAuthor: includeAuthor ? 'true' : undefined,
    })

    return httpClient
      .get<{ note: Note & { author?: Author } }>(`/api/notes/${idOrSlug}?${queryParams}`)
      .then(async (data) => {
        const note = data.note

        // Enrich with author information if requested and not already included
        if (includeAuthor && note?.authorId && !note.author) {
          await _enrichContentWithAuthors([note])
        }

        return note
      })
      .catch((error) => {
        console.error('Error fetching note:', error)
        throw new Error('Failed to load note. Please try again.')
      })
  },

  /**
   * Get quizzes with pagination and filtering
   * @param params Pagination parameters including includeAuthor option
   */
  async getQuizzes(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Quiz & { author?: Author }>> {
    const queryParams = createQueryParams({
      ...params,
      includeAuthor: params.includeAuthor ?? true,
    })

    return httpClient
      .get<PaginatedResponse<Quiz & { author?: Author }>>(`/api/quiz?${queryParams}`)
      .then((response) => {
        // Transform the response to match the expected format
        return {
          ...response,
          data: response.data || [],
          total: response.total || 0,
          page: response.page || 1,
          limit: response.limit || 10,
          totalPages: response.totalPages || 1,
        }
      })
      .catch((error) => {
        console.error('Error fetching quizzes:', error)
        throw new Error('Failed to load quizzes. Please try again.')
      })
  },

  /**
   * Get a single quiz by ID or slug
   */
  async getQuiz(idOrSlug: string, includeAuthor = true): Promise<Quiz & { author?: Author }> {
    // The new endpoint uses slug instead of ID
    return httpClient
      .get<{ success: boolean; quiz: Quiz & { author?: Author } }>(`/api/quiz/${idOrSlug}`)
      .then(async (data) => {
        if (!data.success) {
          throw new Error('Failed to fetch quiz')
        }

        const quiz = data.quiz

        // Enrich with author information if requested and not already included
        if (includeAuthor && quiz?.authorId && !quiz.author) {
          await _enrichContentWithAuthors([quiz])
        }

        return quiz
      })
      .catch((error) => {
        console.error('Error fetching quiz:', error)
        throw new Error('Failed to fetch quiz')
      })
  },

  /**
   * Get quiz questions by quiz ID
   */
  async getQuizQuestions(quizId: string): Promise<{ questions: Array<Record<string, unknown>> }> {
    // The new endpoint includes questions in the main quiz response
    return this.getQuiz(quizId).then((quiz) => {
      // Convert questions to the expected format if they exist
      let questions: Array<Record<string, unknown>> = []

      if (Array.isArray(quiz.questions)) {
        questions = quiz.questions.map((q: Record<string, unknown>) => ({
          ...q,
          // Ensure each question has the expected properties
          id: q.id || '',
          question: q.question || '',
          answers: Array.isArray(q.answers) ? q.answers : [],
          correctAnswerIndex: q.correctAnswerIndex ?? 0,
          explanation: q.explanation || '',
        }))
      }

      return { questions }
    })
  },

  /**
   * Create a new quiz attempt
   */
  async createQuizAttempt(data: { quizId: string; userId: string }): Promise<{
    attemptId: string
  }> {
    return httpClient.post('/api/quiz/attempts', data)
  },

  /**
   * Update an existing quiz attempt
   */
  async updateQuizAttempt(data: {
    attemptId: string
    answers?: Record<string, unknown>
    notes?: Record<string, string>
    status?: string
    timeSpent?: number
    complete?: boolean
  }): Promise<{ success: boolean }> {
    return httpClient.put(`/api/quiz/attempts/${data.attemptId}`, data)
  },

  /**
   * Complete a quiz attempt
   */
  async updateQuizAttemptStatus(data: {
    attemptId: string
    status: string
    timeSpent: number
  }): Promise<{ success: boolean }> {
    return httpClient.put(`/api/quiz/attempts/${data.attemptId}/status`, {
      status: data.status,
      timeSpent: data.timeSpent,
    })
  },

  /**
   * Get quiz attempts for a user
   */
  async getQuizAttempts(userId: string): Promise<Array<Record<string, unknown>>> {
    return httpClient.get(`/api/quiz/attempts?userId=${userId}`)
  },

  /**
   * Get quiz attempt by ID
   */
  async getQuizAttempt(attemptId: string): Promise<Record<string, unknown>> {
    return httpClient.get(`/api/quiz/attempts/${attemptId}`)
  },

  /**
   * Get a resource by type and ID (for download page)
   */
  getResourceById<T = unknown>(resourceType: string, resourceId: string): Promise<T> {
    return httpClient.get<T>(`/api/${resourceType}s/${resourceId}`).catch((error) => {
      console.error(`Error fetching ${resourceType}:`, error)
      throw new Error(`Failed to load ${resourceType}. Please try again.`)
    })
  },

  /**
   * Get content by type with filtering (for FilteredContent component)
   */
  getContentByType<T = unknown>(
    contentType: 'video' | 'note' | 'quiz',
    queryParams: URLSearchParams
  ): Promise<T> {
    return httpClient.get<T>(`/api/${contentType}s?${queryParams.toString()}`).catch((error) => {
      console.error(`Error fetching ${contentType}s:`, error)
      throw new Error(`Failed to load ${contentType}s. Please try again.`)
    })
  },

  /**
   * Save quiz questions
   */
  async saveQuizQuestions(
    quizId: string,
    questions: Array<Record<string, unknown>>
  ): Promise<{ success: boolean }> {
    return httpClient
      .put(`/api/quiz/${quizId}/questions`, { questions })
      .then(() => ({ success: true }))
      .catch((error) => {
        console.error('Error saving quiz questions:', error)
        throw new Error('Failed to save quiz questions. Please try again.')
      })
  },

  /**
   * Get filtered videos for admin page
   */
  async getFilteredVideos(url: string): Promise<{ videos: Video[]; total: number }> {
    // Extract path from URL to avoid CORS issues
    const path = new URL(url).pathname + new URL(url).search

    return httpClient
      .get<{ videos: Video[]; total: number }>(path, {
        headers: {
          'X-Requested-With': 'fetch',
        },
      })
      .catch((error) => {
        console.error('Error fetching filtered videos:', error)
        throw new Error('Failed to load videos. Please try again.')
      })
  },

  /**
   * Get YouTube metadata by video ID
   */
  async getYoutubeMetadata(
    youtubeId: string
  ): Promise<{ title: string; description: string; thumbnailUrl: string }> {
    return httpClient
      .get<{ title: string; description: string; thumbnailUrl: string }>(
        `/api/youtube/metadata?videoId=${youtubeId}`
      )
      .catch((error) => {
        console.error('Error fetching YouTube metadata:', error)
        throw new Error('Failed to load YouTube metadata. Please try again.')
      })
  },

  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return httpClient.post('/api/auth/refresh', { refreshToken })
  },

  async login(credentials: { email: string; password: string }): Promise<{
    user: User
    accessToken: string
    refreshToken: string
  }> {
    return httpClient.post('/api/auth/login', credentials)
  },

  /**
   * Create a new quiz
   */
  async createQuiz(data: Record<string, unknown>): Promise<{ id: string }> {
    return httpClient.post('/api/quizzes', data)
  },

  /**
   * Create a new note
   */
  async createNote(data: Record<string, unknown>): Promise<{ id: string }> {
    return httpClient.post('/api/notes', data)
  },
}
