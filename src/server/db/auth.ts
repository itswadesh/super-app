import { sha256 } from '@oslojs/crypto/sha2'
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { db } from './index'
import { Session, User } from './schema'

const DAY_IN_MS = 1000 * 60 * 60 * 24

export const sessionCookieName = 'connect.sid'

export function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  const token = encodeBase64url(bytes)
  return token
}

export async function createSession(token: string, userId: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  // @ts-ignore
  const session: Session = {
    id: sessionId,
    userId,
    token,
    expiresAt: new Date(Date.now() + DAY_IN_MS * 30).toISOString(),
  }
  await db.insert(Session).values(session)
  return session
}

export async function validateSessionToken(token: string) {
  try {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
    console.log('Validating session token:', sessionId )

    const [result] = await db
      .select({
        user: {
          id: User.id,
          phone: User.phone,
          role: User.role,
          name: User.name,
        },
        session: Session,
      })
      .from(Session)
      .innerJoin(User, eq(Session.userId, User.id))
      .where(eq(Session.id, sessionId))
console.log('userId:::' , result?.user?.id)
    if (!result) {
      console.log('No session found for token')
      return { session: null, user: null }
    }

    const { session, user } = result
    // console.log('Session found:', {
    //   userId: user.id,
    //   expiresAt: session.expiresAt,
    //   currentTime: new Date().toISOString()
    // })

    const sessionExpired = Date.now() >= new Date(session.expiresAt).getTime()
    if (sessionExpired) {
      console.log('Session expired, deleting...')
      await db.delete(Session).where(eq(Session.id, session.id))
      return { session: null, user: null }
    }

    // Renew session if it's more than halfway through its lifetime
    const renewSession = Date.now() >= new Date(session.expiresAt).getTime() - DAY_IN_MS * 15
    if (renewSession) {
      console.log('Renewing session...')
      const newExpiresAt = new Date(Date.now() + DAY_IN_MS * 30).toISOString()
      await db.update(Session).set({ expiresAt: newExpiresAt }).where(eq(Session.id, session.id))

      // Update the session object with new expiry
      session.expiresAt = newExpiresAt
    }

    return { session, user }
  } catch (error) {
    console.error('Error validating session:', error)
    return { session: null, user: null }
  }
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>

export async function invalidateSession(sessionId: string) {
  await db.delete(Session).where(eq(Session.id, sessionId))
}

export function getSessionTokenCookie(c: Context) {
  return getCookie(c, sessionCookieName)
}

export function setSessionTokenCookie(c: Context, token: string, expiresAt: string) {
  const domain = c.req.header('host')?.split(':')[0]
  const isLocalhost = domain === 'localhost' || domain?.startsWith('127.0.0.1')

  // Debug log
  // console.log('Setting session cookie:', {
  //   name: sessionCookieName,
  //   domain,
  //   isLocalhost,
  //   expiresAt: new Date(expiresAt).toISOString()
  // })

  setCookie(c, sessionCookieName, token, {
    expires: new Date(expiresAt),
    path: '/',
    domain: isLocalhost ? undefined : `.${domain}`, // Only set domain for production
    sameSite: 'lax',
    secure: !isLocalhost, // Secure in production
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
  })
}

export function deleteSessionTokenCookie(c: Context) {
  const domain = c.req.header('host')?.split(':')[0]
  const isLocalhost = domain === 'localhost' || domain?.startsWith('127.0.0.1')

  console.log('Deleting session cookie:', {
    name: sessionCookieName,
    domain,
    isLocalhost,
  })

  deleteCookie(c, sessionCookieName, {
    path: '/',
    domain: isLocalhost ? undefined : `.${domain}`,
    secure: !isLocalhost,
    sameSite: 'lax',
  })
}
