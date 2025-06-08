import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../../db'
import { User } from '../../db/schema'
export const routes = new Hono()

export const getOtp = async ({ phone }: { phone: string }) => {
  const otp = '1111' // Fixed OTP for testing purposes

  // Check that required fields are provided
  if (!phone) {
    throw { status: 404, message: 'Phone number is required.' }
  }

  // Check if user exists with this phone number
  const existingUsers = await db.select().from(User).where(eq(User.phone, phone))

  if (existingUsers.length === 0) {
    // User doesn't exist, create a new user
    const userId = crypto.randomUUID()

    await db.insert(User).values({
      id: userId,
      phone: phone,
      otp: otp,
    })

    return { success: true, message: 'OTP sent successfully. New user registered.' }
  } else {
    // User exists, update OTP
    await db.update(User).set({ otp }).where(eq(User.phone, phone))

    return { success: true, message: 'OTP sent successfully' }
  }
}
