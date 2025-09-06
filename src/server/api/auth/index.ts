import { Hono } from 'hono'
import type { Context } from 'hono'
import {
  deleteSessionTokenCookie,
  getSessionTokenCookie,
  invalidateSession,
  setSessionTokenCookie,
  validateSessionToken,
} from '../../db/auth'
import { getOtp } from './get-otp'
import { verifyOtp } from './verify-otp'

export const routes = new Hono()

routes.post('/get-otp', async (c: Context) => {
  const { phone } = await c.req.json()
  try {
    const result = await getOtp({ phone })
    return c.json(result)
  } catch (e: any) {
    console.error('get-otp error:', e)
    return c.json({ ...e, success: false })
  }
})

routes.post('/verify-otp', async (c: Context) => {
  try {
    const { phone, otp } = await c.req.json()
    const result: any = await verifyOtp({ phone, otp })
    if (!result.success) return c.json(result)
    setSessionTokenCookie(c, result.token, result.expiresAt)
    return c.json(result)
  } catch (e: any) {
    return c.json({ message: e?.message || 'Verification Failed' }, e?.status || 400)
  }
})

routes.get('/me', async (c: Context) => {
  // Log all cookies for debugging
  // const allCookies = c.req.raw.headers.get('cookie');
  // console.log('All cookies received:', allCookies);
  // console.log(CONFIG.sessionCookieName, 'sessionCookieName')
  const sessionToken = getSessionTokenCookie(c)
  // console.log('Session token extracted:', sessionToken);

  if (!sessionToken) {
    // console.log('No session token found, returning null session/user');

    return c.json({ session: null, user: null })
  }

  try {
    const { session, user } = await validateSessionToken(sessionToken)
    if (session) {
      setSessionTokenCookie(c, sessionToken, session.expiresAt)
    } else {
      deleteSessionTokenCookie(c)
    }
    // console.log('Session validated successfully for user:', user?.id);
    return c.json({ session, user })
  } catch (error) {
    // console.error('Error validating session:', error);
    return c.json({ session: null, user: null, error: 'Invalid session' })
  }
})

routes.delete('/logout', async (c: Context) => {
  // Log all cookies for debugging
  // const allCookies = c.req.raw.headers.get('cookie');
  // console.log('All cookies at logout:', allCookies);

  const sessionToken = getSessionTokenCookie(c)
  // console.log('Logout: session token found:', sessionToken);

  if (sessionToken) {
    // Invalidate the session in the database
    invalidateSession(sessionToken)
    // console.log('Session invalidated in database');
  }
  // console.log(auth.sessionCookieName, 'aaaaaaaaaaaaaaaaa')
  deleteSessionTokenCookie(c)
  // console.log('All cookie deletion attempts completed');
  return c.json({ success: true, message: 'Logged out successfully' })
})
