import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../../db'
import { createSession, generateSessionToken } from '../../db/auth'
import { User } from '../../db/schema'

export const routes = new Hono()

export const verifyOtp = async ({ phone, otp }: { phone: string; otp: string }) => {
  // Check that required fields are provided
  if (!phone || !otp) {
    throw { status: 404, message: 'Phone number and OTP are required.' }
  }

  // Special handling for development environment - accept OTP "0000" for any phone
  if (process.env.NODE_ENV === 'development' && otp === '0000') {
    // Find user by phone number
    const results = await db.select().from(User).where(eq(User.phone, phone))

    let existingUser = results.at(0)

    if (!existingUser) {
      // User doesn't exist, create a new user
      const userId = crypto.randomUUID()

      const newUser = {
        name: `User ${phone.slice(-4)}`,
        email: '',
        phone: phone,
        passwordHash: '',
        role: 'buyer',
        isVerified: true, // Mark as verified since they completed OTP
        avatar: '',
      }

      await db.insert(User).values(newUser)

      // Fetch the created user to get all fields including timestamps
      const createdUsers = await db.select().from(User).where(eq(User.phone, phone))
      existingUser = createdUsers.at(0)
    } else {
      // Update user as verified
      await db.update(User).set({ isVerified: true }).where(eq(User.id, existingUser.id))
    }

    if (!existingUser) {
      throw { status: 500, message: 'Failed to create or find user.' }
    }

    // Create session for the user
    const sessionToken = generateSessionToken()
    const session = await createSession(sessionToken, existingUser.id)

    return {
      success: true,
      message: 'Development login successful - OTP 0000 accepted',
      token: sessionToken,
      expiresAt: session.expiresAt,
      user: {
        id: existingUser.id,
        phone: existingUser.phone,
        name: existingUser.name,
        role: existingUser.role,
      },
    }
  }

  // Special mock login for +918249028220 - bypass OTP verification
  if (phone === '+918249028220') {
    // Find or create user for this phone number
    const results = await db.select().from(User).where(eq(User.phone, phone))

    let existingUser = results.at(0)

    if (!existingUser) {
      // Create a new user with special role (host)
      const userId = crypto.randomUUID()

      const newUser = {
        name: 'Mock Host User',
        email: 'mock@host.com',
        phone: phone,
        passwordHash: '',
        role: 'host', // Special role for mock login
        isVerified: true,
        avatar: '',
      }

      await db.insert(User).values(newUser)

      // Fetch the created user
      const createdUsers = await db.select().from(User).where(eq(User.phone, phone))
      existingUser = createdUsers.at(0)
    }

    if (!existingUser) {
      throw { status: 500, message: 'Failed to create or find user.' }
    }

    // Create session for the user
    const sessionToken = generateSessionToken()
    const session = await createSession(sessionToken, existingUser.id)

    return {
      success: true,
      message: 'Mock login successful - no OTP required',
      token: sessionToken,
      expiresAt: session.expiresAt,
      user: {
        id: existingUser.id,
        phone: existingUser.phone,
        name: existingUser.name,
        role: existingUser.role,
      },
    }
  }

  // For demo purposes, accept any 4-digit OTP for other numbers
  if (otp.length !== 4 || !/^\d{4}$/.test(otp)) {
    throw { status: 400, message: 'Invalid OTP format.' }
  }

  // Find user by phone number
  const results = await db.select().from(User).where(eq(User.phone, phone))

  let existingUser = results.at(0)

  if (!existingUser) {
    // User doesn't exist, create a new user
    const userId = crypto.randomUUID()

    const newUser = {
      name: `User ${phone.slice(-4)}`,
      email: '',
      phone: phone,
      passwordHash: '',
      role: 'buyer',
      isVerified: true, // Mark as verified since they completed OTP
      avatar: '',
    }

    await db.insert(User).values(newUser)

    // Fetch the created user to get all fields including timestamps
    const createdUsers = await db.select().from(User).where(eq(User.phone, phone))
    existingUser = createdUsers.at(0)
  } else {
    // Update user as verified
    await db.update(User).set({ isVerified: true }).where(eq(User.id, existingUser.id))
  }

  if (!existingUser) {
    throw { status: 500, message: 'Failed to create or find user.' }
  }

  // Create session for the user
  const sessionToken = generateSessionToken()
  const session = await createSession(sessionToken, existingUser.id)

  return {
    success: true,
    message: 'Login successful',
    token: sessionToken,
    expiresAt: session.expiresAt,
    user: {
      id: existingUser.id,
      phone: existingUser.phone,
      name: existingUser.name,
      role: existingUser.role,
    },
  }
}
