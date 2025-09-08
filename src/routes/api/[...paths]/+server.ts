import type { RequestHandler } from '@sveltejs/kit'
import api from '../../../server/api'

// Generic handler function that we'll use for all HTTP methods
const handleRequest = async ({ request, locals }: { request: Request; locals: any }) => {
  const method = request.method

  // Clone the request and add user header
  const requestWithUser = request.clone()
  requestWithUser.headers.set('x-user', JSON.stringify(locals.user || null))

  const response = await api.fetch(requestWithUser)

  if (!response.ok) {
    const error = await response
      .clone()
      .json()
      .catch(() => ({}))
    console.error(`${method} ${request.url} Error:`)
  }
  return response
}

// Export the same handler for all HTTP methods
export const GET: RequestHandler = handleRequest
export const POST: RequestHandler = handleRequest
export const PATCH: RequestHandler = handleRequest
export const PUT: RequestHandler = handleRequest
export const DELETE: RequestHandler = handleRequest
