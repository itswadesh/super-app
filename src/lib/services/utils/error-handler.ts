import { toast } from 'svelte-sonner'

type ErrorResponse = {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor({ message, status = 500, errors = {} }: ErrorResponse) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export const handleApiError = (error: unknown, defaultMessage = 'An error occurred'): never => {
  if (error instanceof ApiError) {
    // Show error to user
    toast.error(error.message || defaultMessage)

    // Log detailed error in development
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        message: error.message,
        status: error.status,
        errors: error.errors,
      })
    }

    throw error
  }

  // Handle non-API errors
  const errorMessage = error instanceof Error ? error.message : String(error)

  toast.error(defaultMessage)

  if (import.meta.env.DEV) {
    console.error('Unexpected error:', error)
  }

  throw new ApiError({
    message: errorMessage,
    status: 500,
  })
}

export const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorData: { message?: string; errors?: Record<string, string[]> } = {}

    try {
      errorData = await response.json()
    } catch {
      // If we can't parse the error response, use the status text
      errorData = { message: response.statusText }
    }

    throw new ApiError({
      message: errorData.message || 'Request failed',
      status: response.status,
      errors: errorData.errors || {},
    })
  }

  return response.json()
}
