import { errorService } from './error-service'

interface User {
  id: string
  name?: string
  email?: string
  phone?: string
  board?: string
  class?: string
  profilePicture?: string
  subscriptionId?: string
  role?: string
  createdAt?: string
}

/**
 * Service for user-related API calls
 */
class UserService {
  /**
   * Get a list of all users (admin only)
   */
  async getUsers() {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return response
    } catch (error) {
      // Log error and re-throw
      errorService.logError('API Error', 'Failed to fetch users', error)
      throw error
    }
  }

  /**
   * Get a user by ID
   */
  async getUserById(userId: string) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return response
    } catch (error) {
      errorService.logError('API Error', `Failed to fetch user with ID: ${userId}`, error)
      throw error
    }
  }

  /**
   * Update a user's profile
   */
  async updateUser(userId: string, userData: Partial<User>) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      return response
    } catch (error) {
      errorService.logError('API Error', `Failed to update user with ID: ${userId}`, error)
      throw error
    }
  }
}

export const userService = new UserService()
