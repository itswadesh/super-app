/**
 * Error service for handling API calls related to error reporting
 */

/**
 * Error interface
 */
export interface ErrorLog {
  id: string
  fingerprint: string
  source: string
  message: string
  details?: any
  category?: string
  occurrences: number
  isIgnored: boolean
  firstSeen: string
  lastSeen: string
}

/**
 * Error statistics interface
 */
export interface ErrorStats {
  totalErrors: number
  categoryCounts: {
    [category: string]: number
  }
}

/**
 * Error Service for making error-related API calls
 */
export const errorService = {
  /**
   * Log an error
   */
  async logError(
    source: string,
    message: string,
    details?: any,
    category = 'general',
  ): Promise<{ success: boolean; errorId?: string }> {
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          message,
          details,
          category,
        }),
      })

      return await response.json()
    } catch (error) {
      console.error('Error logging failed:', error)
      return { success: false }
    }
  },

  /**
   * Log an API error
   */
  async logApiError(method: string, url: string, error: any): Promise<{ success: boolean; errorId?: string }> {
    try {
      const response = await fetch('/api/errors/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          url,
          error,
        }),
      })

      return await response.json()
    } catch (error) {
      console.error('API Error logging failed:', error)
      return { success: false }
    }
  },

  /**
   * Get all errors (admin only)
   */
  async getErrors(showIgnored = false, category?: string): Promise<ErrorLog[]> {
    try {
      const queryParams = new URLSearchParams()
      if (showIgnored) {
        queryParams.append('showIgnored', 'true')
      }
      if (category) {
        queryParams.append('category', category)
      }

      const response = await fetch(`/api/admin/errors?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to load errors')
      }

      const data = await response.json()
      return data.errors
    } catch (error) {
      console.error('Error fetching errors:', error)
      throw new Error('Failed to load errors. Please try again.')
    }
  },

  /**
   * Get error statistics (admin only)
   */
  async getErrorStats(): Promise<ErrorStats> {
    try {
      const response = await fetch('/api/admin/errors/stats')

      if (!response.ok) {
        throw new Error('Failed to load error statistics')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching error stats:', error)
      throw new Error('Failed to load error statistics. Please try again.')
    }
  },

  /**
   * Update an error (admin only)
   */
  async updateError(id: string, isIgnored: boolean): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/admin/errors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isIgnored,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update error')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating error:', error)
      throw new Error('Failed to update error. Please try again.')
    }
  },

  /**
   * Get error by ID (admin only)
   */
  async getErrorById(id: string): Promise<any> {
    try {
      const response = await fetch(`/api/admin/errors/${id}`)
      return response
    } catch (error) {
      console.error(`Error fetching error with ID ${id}:`, error)
      throw new Error(`Failed to load error with ID ${id}.`)
    }
  },

  /**
   * Delete all errors (admin only)
   */
  async createOrUpdateError(): Promise<any> {
    try {
      const response = await fetch('/api/admin/errors', {
        method: 'DELETE',
      })
      return response
    } catch (error) {
      console.error('Error deleting all errors:', error)
      throw new Error('Failed to delete all errors.')
    }
  },

  /**
   * Delete error by ID (admin only)
   */
  async deleteError(id: string): Promise<any> {
    try {
      const response = await fetch(`/api/admin/errors/${id}`, {
        method: 'DELETE',
      })
      return response
    } catch (error) {
      console.error(`Error deleting error with ID ${id}:`, error)
      throw new Error(`Failed to delete error with ID ${id}.`)
    }
  },

  /**
   * Get errors by ignored status (admin only)
   */
  async getErrorsByStatus(isIgnored = false): Promise<{ errors: ErrorLog[] }> {
    try {
      const url = new URL('/api/admin/errors', window.location.origin)
      url.searchParams.set('ignored', isIgnored ? 'true' : 'false')

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error('Failed to load errors')
      }

      const data = await response.json()
      return { errors: data.errors || [] }
    } catch (error) {
      console.error('Error fetching errors by status:', error)
      throw new Error('Failed to load errors. Please try again.')
    }
  },
}
