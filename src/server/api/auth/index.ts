import { sha256 } from '@oslojs/crypto/sha2'
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { CONFIG } from '../../config'
import { db } from '../../db'
import {
  deleteSessionTokenCookie,
  getSessionTokenCookie,
  invalidateSession,
  setSessionTokenCookie,
  validateSessionToken,
} from '../../db/auth'
import { Session } from '../../db/schema'
import { getOtp } from './get-otp'
import { verifyOtp } from './verify-otp'
import { signupHost } from './signup'

export const routes = new Hono()

// export async function invalidateSession(sessionId: string) {
// 	await db.delete(Session).where(eq(Session.id, sessionId));
// }

// export function generateSessionToken() {
//     const bytes = crypto.getRandomValues(new Uint8Array(18));
//     const token = encodeBase64url(bytes);
//     return token;
// }

// export async function createSession(token: string, userId: string) {
//     const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
//     const session: Session = {
//         id: sessionId,
//         userId,
//         expiresAt: new Date(Date.now() + CONFIG.DAY_IN_MS * 30)
//     };
//     await db.insert(Session).values(session);
//     return session;
// }

// export const validateSessionToken = async (token: string) => {
//     const results = await db
//         .select()
//         .from(Session)
//         .where(eq(Session.id, token));
//     const existingSession = results.at(0);
//     if (!existingSession) {
//         throw { status: 404, message: 'Invalid session token.' }
//     }
//     return existingSession;
// }

// export function setSessionTokenCookie(c: Context, token: string, expiresAt: Date) {
//     setCookie(c, CONFIG.sessionCookieName, token, {
//         expires: expiresAt,
//         path: '/',
//     });
// }

// export function deleteSessionTokenCookie(c: Context) {
//     deleteCookie(c, CONFIG.sessionCookieName, {
//         path: '/',
//     });
// }

routes.post('/get-otp', async (c: Context) => {
  const { phone } = await c.req.json()
  const result = await getOtp({ phone })
  return c.json(result)
})

routes.post('/verify-otp', async (c: Context) => {
  const { phone, otp } = await c.req.json()
  const result = await verifyOtp({ phone, otp })
  setSessionTokenCookie(c, result.token, result.expiresAt)
  return c.json(result)
})

routes.post('/signup', async (c: Context) => {
  const data = await c.req.json()
  const result = await signupHost(data)
  return c.json(result)
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
  deleteCookie(c, 'connect.sid');
  // console.log('All cookie deletion attempts completed');
  return c.json({ success: true, message: 'Logged out successfully' })
})
