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
      name: `User ${phone.slice(-4)}`, // Default name based on phone
      email: '',
      phone: phone,
      passwordHash: '', // Will be set later if needed
      role: 'buyer',
      isVerified: false,
      avatar: '',
    })

    return { success: true, message: 'OTP sent successfully. New user registered.' }
  } else {
    // User exists, just return success
    return { success: true, message: 'OTP sent successfully' }
  }
}
