import type { Context, Next } from 'hono'
import { getSessionTokenCookie, validateSessionToken } from '../db/auth'

/**
 * USAGE EXAMPLES:
 *
 * // Import from index (recommended)
 * import { authenticate, optionalAuthenticate } from '../middlewares'
 *
 * // Or import directly
 * import { authenticate } from '../middlewares/auth'
 *
 * // Apply to routes
 * routes.post('/protected', authenticate, handler)
 * routes.get('/optional', optionalAuthenticate, handler)
 *
 * // Access user in handlers
 * const user = c.get('user')
 * const session = c.get('session')
 */

/**
 * Authentication middleware for Hono
 * Validates session token and attaches user/session to context
 */
export const authenticate = async (c: Context, next: Next) => {
  const sessionToken = getSessionTokenCookie(c)

  if (!sessionToken) {
    return c.json({ error: 'No session token provided' }, 401)
  }

  try {
    const { session, user } = await validateSessionToken(sessionToken)

    if (!session || !user) {
      return c.json({ error: 'Invalid or expired session' }, 401)
    }

    // Attach user and session to context
    c.set('user', user)
    c.set('session', session)

    await next()
  } catch (error) {
    console.error('Authentication error:', error)
    return c.json({ error: 'Authentication failed' }, 401)
  }
}

/**
 * Optional authentication middleware
 * Attaches user/session to context if token is valid, but doesn't fail if not authenticated
 */
export const optionalAuthenticate = async (c: Context, next: Next) => {
  const sessionToken = getSessionTokenCookie(c)

  if (sessionToken) {
    try {
      const { session, user } = await validateSessionToken(sessionToken)

      if (session && user) {
        // Attach user and session to context
        c.set('user', user)
        c.set('session', session)
      }
    } catch (error) {
      // Silently ignore auth errors for optional auth
      console.warn('Optional authentication failed:', error)
    }
  }

  await next()
}