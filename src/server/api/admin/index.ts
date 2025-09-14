import { Hono } from 'hono'
import { getSessionTokenCookie, validateSessionToken } from '../../db/auth'
import { categoryRoutes } from './categories'
import { couponRoutes } from './coupons'
import errorRoutes from './errors'
import { productRoutes } from './products'
import { vendorRoutes } from './vendors'
import { userRoutes } from './users'
// Create admin router for all admin-related API endpoints
const router = new Hono()

// Middleware to check admin access for all admin routes
import type { Context } from 'hono'

const checkAdmin = async (c: Context, next: () => Promise<void>) => {
  const sessionToken = getSessionTokenCookie(c)
  const result = await validateSessionToken(sessionToken || '')

  if (!result.user) {
    // || result.user.role !== 'admin'
    return c.json({ message: 'Unauthorized. Admin access required.' }, 403)
  }

  await next()
}

// Apply admin check middleware to all routes
router.use('*', checkAdmin)

// Admin dashboard stats endpoint
router.get('/', async (c) => {
  return c.json({
    message: 'Admin API is running',
    timestamp: new Date().toISOString(),
  })
})

// Mount sub-routers
router.route('/coupons', couponRoutes)
router.route('/errors', errorRoutes)
router.route('/products', productRoutes)
router.route('/categories', categoryRoutes)
router.route('/vendors', vendorRoutes)
router.route('/users', userRoutes)

export default router
