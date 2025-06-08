import { sha256 } from '@oslojs/crypto/sha2'
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { db } from './index'
import { Session, User } from './schema'

const DAY_IN_MS = 1000 * 60 * 60 * 24

export const sessionCookieName = 'auth-session'

export function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  const token = encodeBase64url(bytes)
  return token
}

export async function createSession(token: string, userId: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + DAY_IN_MS * 30),
  }
  await db.insert(Session).values(session)
  return session
}

export async function validateSessionToken(token: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  const [result] = await db
    .select({
      // Adjusted user table to match the current schema with phone and role
      user: { id: User.id, phone: User.phone, role: User.role },
      session: Session,
    })
    .from(Session)
    .innerJoin(User, eq(Session.userId, User.id))
    .where(eq(Session.id, sessionId))

  if (!result) {
    return { session: null, user: null }
  }
  const { session, user } = result

  const sessionExpired = Date.now() >= session.expiresAt.getTime()
  if (sessionExpired) {
    await db.delete(Session).where(eq(Session.id, session.id))
    return { session: null, user: null }
  }

  const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15
  if (renewSession) {
    session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30)
    await db.update(Session).set({ expiresAt: session.expiresAt }).where(eq(Session.id, session.id))
  }

  return { session, user }
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>

export async function invalidateSession(sessionId: string) {
  await db.delete(Session).where(eq(Session.id, sessionId))
}

export function getSessionTokenCookie(c: Context) {
  return getCookie(c, sessionCookieName)
}

export function setSessionTokenCookie(c: Context, token: string, expiresAt: Date) {
  setCookie(c, sessionCookieName, token, {
    expires: expiresAt,
    path: '/',
    sameSite: 'lax',
    secure: false,
    httpOnly: true,
  })
}

export function deleteSessionTokenCookie(c: Context) {
  deleteCookie(c, sessionCookieName, {
    path: '/',
  })
}
