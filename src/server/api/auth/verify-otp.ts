import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../../db'
import { createSession, generateSessionToken } from '../../db/auth'
import { User } from '../../db/schema'

export const routes = new Hono()

export const verifyOtp = async ({ phone, otp }: { phone: string; otp: string }) => {
  // Check that required fields are provided
  if (!phone || !otp) {
    throw { status: 400, message: 'Phone number and OTP are required.' }
  }

  const results = await db
    .select()
    .from(User)
    .where(and(eq(User.phone, phone), eq(User.otp, otp)))

  const existingUser = results.at(0)
  if (!existingUser) {
    return {
      success: false,
      message: 'Invalid OTP',
    }
  }
  // Create session for the user
  const sessionToken = generateSessionToken()
  const session = await createSession(sessionToken, existingUser?.id)
  return {
    success: true,
    message: 'Login successful',
    token: sessionToken,
    expiresAt: session.expiresAt,
    user: {
      id: existingUser?.id,
      phone: existingUser?.phone,
    },
  }
}
