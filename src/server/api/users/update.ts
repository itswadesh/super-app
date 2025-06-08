import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from './../../db'
import { user } from './../../db/schema'
import type { Session, User } from './../../db/schema'

// Declare types for auth function
interface AuthSession {
  user: { id: string; phone: string } | null
  session: Session | null
}

// Extend Locals with auth method
declare global {
  namespace App {
    interface Locals {
      user: { id: string; phone: string } | null
    }
  }
}

// User update schema for validation
const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(15).optional(),
  avatar: z.string().optional(),
})

export const PUT = async (c) => {
  try {
    // 1. Check authentication
    const session = c.locals.user
    if (!session) {
      throw error(401, 'Authentication required to update user profile')
    }

    // Extract user ID from the session
    const userId = session.id
    if (!userId) {
      throw error(401, 'Invalid user session')
    }

    // 2. Get and validate user input
    const requestData = await c.req.json()

    // Validate using zod schema
    const validationResult = userUpdateSchema.safeParse(requestData)
    if (!validationResult.success) {
      // Return validation errors
      return json(
        {
          success: false,
          error: 'Invalid user data',
          validationErrors: validationResult.error.format(),
        },
        { status: 400 },
      )
    }

    const validatedData = validationResult.data

    // 3. Get the existing user
    const existingUserResult = await db.select().from(user).where(eq(user.id, userId)).limit(1)

    if (!existingUserResult.length) {
      throw error(404, 'User not found')
    }

    const existingUser = existingUserResult[0]

    // 4. Prepare update fields
    // Note: The existing schema doesn't have these fields,
    // so we'd need to extend it in a real application.
    // For now, we'll store this data in a separate table or just
    // update the fields we know exist

    // 5. Update the user in the database
    // We'll add fields that don't exist in the current schema
    // to a separate 'user_profiles' table in a real implementation

    // In this example, we're just updating the phone field
    // which is the only updatable field in the current schema
    if (validatedData.phone) {
      await db
        .update(user)
        .set({
          phone: validatedData.phone,
          // In a real app, we would also hash any new OTP if needed
        })
        .where(eq(user.id, userId))
    }

    // 6. Get updated user
    const updatedUserResult = await db.select().from(user).where(eq(user.id, userId)).limit(1)

    if (!updatedUserResult.length) {
      throw error(500, 'Failed to retrieve updated user')
    }

    // 7. Return success response with the updated user
    // Combine database fields with the client-provided fields
    // that aren't in our database yet
    return json(
      {
        success: true,
        data: {
          user: {
            id: updatedUserResult[0].id,
            phone: updatedUserResult[0].phone,
            // Include the validated fields from client
            name: validatedData.name,
            avatar: validatedData.avatar,
            updatedAt: new Date().toISOString(),
          },
        },
      },
      { status: 200 },
    )
  } catch (err: unknown) {
    console.error('Error updating user:', err)

    // Type guard for SvelteKit error
    if (typeof err === 'object' && err !== null && 'status' in err && 'body' in err) {
      // This is an error thrown by SvelteKit's `error` function
      const svelteError = err as { status: number; body: { message: string } }
      return json(
        {
          success: false,
          error: svelteError.body.message,
        },
        { status: svelteError.status },
      )
    }

    return json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error updating user',
      },
      { status: 500 },
    )
  }
}
