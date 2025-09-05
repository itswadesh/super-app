import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import adminRoutes from './admin'
import { routes as authRoutes } from './auth'
import { categoryRoutes } from './categories'
import { checkoutRoutes } from './checkout'
import { ordersRoutes } from './orders'
import { productRoutes } from './products'
import { litekartStoreRoutes } from './litekart-stores'
import { routes as foodRoutes } from './foods'
import { routes as applicationRoutes } from './applications'
import { getSessionTokenCookie, validateSessionToken } from '../db/auth'

// Inner router for API paths
const apiRouter = new Hono()

// Middleware to extract user from headers or session cookies
apiRouter.use('*', async (c, next) => {
  // First try to get user from x-user header (for backward compatibility)
  const userHeader = c.req.header('x-user')
  if (userHeader) {
    try {
      c.req.user = JSON.parse(userHeader)
    } catch (e) {
      console.error('Failed to parse user from header:', e)
    }
  } else {
    // If no header, try to get user from session cookie
    const sessionToken = getSessionTokenCookie(c)
    if (sessionToken) {
      try {
        const { session, user } = await validateSessionToken(sessionToken)
        if (session && user) {
          c.req.user = user
        }
      } catch (error) {
        console.error('Failed to validate session token:', error)
      }
    }
  }
  await next()
})

// Universal error-catching middleware
apiRouter.use('*', async (c, next) => {
  try {
    await next()
  } catch (err: any) {
    if (err instanceof HTTPException) {
      throw err // Already an HTTPException
    }
    // Wrap any other error
    throw new HTTPException(err.status || 500, {
      message: err?.message || 'Unexpected error occurred',
    })
  }
})

// Health check
apiRouter.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Super App API is running',
    timestamp: new Date().toISOString(),
  })
})

// Example of an error thrown from a route for testing the error handler
apiRouter.get('/test-error', (c) => {
  throw { status: 400, message: 'This is a test error' }
})

// Mount all sub-routers
apiRouter.route('/checkout', checkoutRoutes)
apiRouter.route('/orders', ordersRoutes)
apiRouter.route('/products', productRoutes)
apiRouter.route('/auth', authRoutes)
apiRouter.route('/admin', adminRoutes)
apiRouter.route('/categories', categoryRoutes)
apiRouter.route('/litekart/stores', litekartStoreRoutes)
apiRouter.route('/foods', foodRoutes)
apiRouter.route('/applications', applicationRoutes)

// Global error handler for all API routes
apiRouter.onError((err: any, c) => {
  console.error('Error handler triggered:', err)
  const status = err.status || 500
  const message = err.message || 'Internal Server Error'
  // Return more detailed error information for debugging
  return c.json(
    {
      message,
      status,
      details: err?.message || String(err),
      stack: err?.stack ? err.stack.split('\n').slice(0, 5).join('\n') : undefined,
    },
    status
  )
})

// Create the main app and mount the API router at /api
const app = new Hono()
app.route('/api', apiRouter)

// Export for use in SvelteKit and other places
export const apiRoutes = apiRouter
export default app
export type Router = typeof apiRouter
