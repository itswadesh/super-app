import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { User } from '../../../../db/schema'
import { db } from '../../../../db'
import type { CreateUserRequest, UserResponse } from '../types'

type NewUser = Omit<typeof User.$inferInsert, 'id' | 'createdAt' | 'updatedAt'> & {
  id: string
  otp: string
  createdAt: Date
  updatedAt: Date
}

export async function createUser(c: Context) {
  try {
    const data = await c.req.json<CreateUserRequest>()

    // Validate required fields
    if (!data.phone) {
      return c.json({ error: 'Phone number is required' }, 400)
    }

    // Check if user with this phone already exists
    const existingUser = await db.select().from(User).where(eq(User.phone, data.phone)).get()

    if (existingUser) {
      return c.json({ error: 'User with this phone number already exists' }, 409)
    }

    // Create new user
    const now = new Date()
    const newUser: NewUser = {
      id: crypto.randomUUID(),
      phone: data.phone,
      role: data.role || 'user',
      age: data.age || null,
      otp: '',
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(User).values(newUser).run()

    // Format the response (don't include sensitive data like OTP)
    const { otp: _, ...userWithoutOtp } = newUser
    const response: UserResponse = {
      ...userWithoutOtp,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    }

    return c.json(response, 201)
  } catch (error) {
    console.error('Error creating user:', error)
    return c.json({ error: 'Failed to create user' }, 500)
  }
}
