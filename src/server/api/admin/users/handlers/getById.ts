import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { User } from '../../../../db/schema'
import { db } from '../../../../db'
import type { UserResponse } from '../types'

export async function getUserById(c: Context<{ Bindings: { id: string } }>) {
  type UserWithTimestamps = typeof User.$inferSelect & {
    createdAt: Date | null
    updatedAt: Date | null
  }
  try {
    const userId = c.req.param('id')

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400)
    }

    const user = (await db.select().from(User).where(eq(User.id, userId)).get()) as
      | UserWithTimestamps
      | undefined

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Format the response
    const response: UserResponse = {
      ...user,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    }

    return c.json(response)
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return c.json({ error: 'Failed to get user' }, 500)
  }
}
