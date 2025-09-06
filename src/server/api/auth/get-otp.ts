import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../../db'
import { User } from '../../db/schema'
import { sendOtpSms } from '../../services/sms'
export const routes = new Hono()

// 1 minute cooldown in milliseconds
const OTP_COOLDOWN_MS = 60 * 1000

export const getOtp = async ({ phone }: { phone: string }) => {
  // Check that required fields are provided
  if (!phone) {
    console.log('Phone missing')
    throw { status: 400, message: 'Phone number is required.' }
  }

  // Check if user exists with this phone number
  const existingUsers = await db.select().from(User).where(eq(User.phone, phone))
  const now = new Date()

  // Check cooldown for existing users
  if (existingUsers.length > 0) {
    const user = existingUsers[0]
    if (user.otpRequestedAt) {
      const lastRequestTime = new Date(user.otpRequestedAt).getTime()
      const timeSinceLastRequest = now.getTime() - lastRequestTime

      if (timeSinceLastRequest < OTP_COOLDOWN_MS) {
        console.log('Cooldown triggered for', phone)
        const remainingTime = Math.ceil((OTP_COOLDOWN_MS - timeSinceLastRequest) / 1000)
        throw {
          status: 429,
          message: `Please wait ${remainingTime} seconds before requesting a new OTP.`,
          remainingTime,
        }
      }
    }
  }

  const otp =
    process.env.NODE_ENV === 'development'
      ? '1111'
      : Math.floor(1000 + Math.random() * 9000).toString()

  // Only send OTP in production
  if (process.env.NODE_ENV !== 'development') {
    await sendOtpSms({ phone, otp })
  }

  if (existingUsers.length === 0) {
    // User doesn't exist, create a new user
    // const userId = crypto.randomUUID().replaceAll('-', '')
    await db.insert(User).values({
      phone: phone,
      otp: otp,
      otpRequestedAt: now.toISOString(),
    })
    return { success: true, message: 'OTP sent successfully. New user registered.' }
  }

  // User exists, update OTP and requested timestamp
  await db
    .update(User)
    .set({
      otp,
      otpRequestedAt: now.toISOString(),
    })
    .where(eq(User.phone, phone))

  return { success: true, message: 'OTP sent successfully' }
}
