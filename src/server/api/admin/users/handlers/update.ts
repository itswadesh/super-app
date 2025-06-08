import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { User } from '../../../../db/schema'
import { db } from '../../../../db'
import type { UpdateUserRequest, UserResponse } from '../types'

type UserWithTimestamps = typeof User.$inferSelect & {
  createdAt: Date | null
  updatedAt: Date | null
}

export async function updateUser(c: Context<{ Bindings: { id: string } }>) {
  try {
    const userId = c.req.param('id')
    const data = await c.req.json<UpdateUserRequest>()

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400)
    }

    // Check if user exists
    const existingUser = await db.select().from(User).where(eq(User.id, userId)).get()

    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Check if phone is being updated and if it's already taken
    if (data.phone && data.phone !== existingUser.phone) {
      const userWithSamePhone = await db.select().from(User).where(eq(User.phone, data.phone)).get()

      if (userWithSamePhone) {
        return c.json({ error: 'Phone number is already in use' }, 409)
      }
    }

    // Prepare update data
    const updateData: Partial<typeof User.$inferInsert> = {
      ...(data.phone && { phone: data.phone }),
      ...(data.role && { role: data.role }),
      ...(data.age !== undefined && { age: data.age }),
      updatedAt: new Date(),
    }

    // Update user
    await db.update(User).set(updateData).where(eq(User.id, userId)).run()

    // Get updated user
    const updatedUser = (await db.select().from(User).where(eq(User.id, userId)).get()) as
      | UserWithTimestamps
      | undefined

    if (!updatedUser) {
      return c.json({ error: 'Failed to update user' }, 500)
    }

    // Format the response
    const { otp, ...userWithoutOtp } = updatedUser
    const response: UserResponse = {
      ...userWithoutOtp,
      createdAt: updatedUser.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: updatedUser.updatedAt?.toISOString() || new Date().toISOString(),
    }

    return c.json(response)
  } catch (error) {
    console.error('Error updating user:', error)
    return c.json({ error: 'Failed to update user' }, 500)
  }
}
