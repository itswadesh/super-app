import { httpClient } from './http-client'

/**
 * User interface
 */
interface User {
  id: string
  phone: string
  email?: string
  name?: string
  role?: string
  createdAt: string
  updatedAt: string
}

/**
 * Session interface
 */
interface Session {
  id: string
  userId: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

/**
 * Interface for login response from the API
 */
interface LoginResponse {
  success: boolean
  message?: string
  user?: User
  token?: string
  error?: string
}

/**
 * Interface for OTP verification input
 */
interface VerifyOtpInput {
  phone: string
  otp: string
}

/**
 * Auth Service for making authentication-related API calls
 */
export const authService = {
  /**
   * Send OTP to the provided phone number
   * @param phone Phone number to send OTP to
   */
  async sendOtp(phone: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return httpClient.post('/api/auth/get-otp', { phone })
  },

  /**
   * Verify OTP and login the user
   * @param phone Phone number for verification
   * @param otp OTP code entered by user
   */
  verifyOtp(phone: string, otp: string): Promise<LoginResponse> {
    return httpClient.post('/api/auth/verify-otp', { phone, otp })
  },

  /**
   * Get current user profile
   */
  getCurrentUser(): Promise<{ session?: Session; user?: User }> {
    return httpClient.get<{ session?: Session; user?: User }>('/api/auth/me')
  },

  /**
   * Log out the current user
   */
  logout(): Promise<{ success: boolean }> {
    return httpClient.delete('/api/auth/logout')
  },
}
