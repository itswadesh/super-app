import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { User, Session } from '../../../../db/schema'
import { db } from '../../../../db'
import { getSessionTokenCookie } from '../../../../db/auth'

export async function deleteUser(c: Context<{ Bindings: { id: string } }>) {
  try {
    const userId = c.req.param('id')

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400)
    }

    // Check if user exists
    const existingUser = await db.select().from(User).where(eq(User.id, userId)).get()

    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Prevent deleting your own account (optional safety check)
    const sessionToken = getSessionTokenCookie(c)
    if (sessionToken) {
      const session = await db.select().from(Session).where(eq(Session.id, sessionToken)).get()

      if (session && session.userId === userId) {
        return c.json({ error: 'Cannot delete your own account' }, 403)
      }
    }

    // Delete the user
    await db.delete(User).where(eq(User.id, userId)).run()

    // Also delete any associated sessions
    await db.delete(Session).where(eq(Session.userId, userId)).run()

    return c.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return c.json({ error: 'Failed to delete user' }, 500)
  }
}
