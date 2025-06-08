/**
 * API Service
 * Centralized service for handling all API requests with standard methods
 */

// Response interface for typed API responses
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  status: number
}

// Base API configuration
const API_BASE_URL = '/api'

/**
 * Generic API handler with consistent error handling and response formatting
 */
async function apiCall<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

    // Merge default headers with provided options
    const fetchOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'same-origin', // Include cookies
      ...options,
    }

    const response = await fetch(url, fetchOptions)
    let data
    const contentType = response.headers.get('content-type')

    // Parse response based on content type
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else if (contentType?.includes('text/')) {
      data = await response.text()
    } else {
      data = await response.blob()
    }

    // Standardize response format
    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data?.message || response.statusText || 'Unknown error',
      status: response.status,
    }
  } catch (error) {
    console.error('API call failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0, // Network error or other failures
    }
  }
}

/**
 * API Service providing standardized methods for CRUD operations
 */
export const apiService = {
  /**
   * Perform a GET request
   */
  get: <T = any>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> => {
    // Convert params object to URL search params if provided
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, value)
      })
      endpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${searchParams.toString()}`
    }

    return apiCall<T>(endpoint, { method: 'GET' })
  },

  /**
   * Perform a POST request with JSON data
   */
  post: <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Perform a PUT request with JSON data
   */
  put: <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Perform a DELETE request
   */
  delete: <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'DELETE' })
  },

  /**
   * Perform a PATCH request
   */
  patch: <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Upload a file or form data
   */
  upload: <T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set the correct Content-Type with boundary
    })
  },

  // User specific API methods
  user: {
    /**
     * Update the current user's profile
     */
    update: <T = any>(userData: any): Promise<ApiResponse<T>> => {
      return apiService.put('/user/update', userData)
    },

    /**
     * Get the current user's points and goals
     */
    getPoints: <T = any>(): Promise<ApiResponse<T>> => {
      return apiService.get('/user/points')
    },

    /**
     * Complete a goal for the current user
     */
    completeGoal: <T = any>(goalId: string): Promise<ApiResponse<T>> => {
      return apiService.post('/user/points/complete-goal', { goalId })
    },

    /**
     * Complete a special action for the current user
     */
    completeSpecialAction: <T = any>(actionId: string): Promise<ApiResponse<T>> => {
      return apiService.post('/user/points/complete-special-action', { actionId })
    },

    /**
     * Apply a level reward to the current user
     */
    applyLevelReward: <T = any>(level: number): Promise<ApiResponse<T>> => {
      return apiService.post('/user/apply-level-reward', { level })
    },

    /**
     * Get the user's quiz history
     */
    getQuizHistory: <T = any>(): Promise<ApiResponse<T>> => {
      return apiService.get('/quiz/history')
    },
  },

  // Subscription specific API methods
  subscription: {
    /**
     * Check the current user's subscription status
     */
    check: <T = any>(): Promise<ApiResponse<T>> => {
      return apiService.get('/subscription')
    },

    /**
     * Create a new subscription for the current user
     */
    create: <T = any>(subscriptionData: any): Promise<ApiResponse<T>> => {
      return apiService.post('/subscription', subscriptionData)
    },
  },
}
