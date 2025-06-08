import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Author } from '../../../../db/schema'

/**
 * Delete an author by ID
 */
export async function deleteAuthor(c: Context): Promise<Response> {
  try {
    // Validate session
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get author ID from URL parameters
    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'Author ID is required' }, 400)
    }

    // Check if author exists
    const existingAuthor = await db.select().from(Author).where(eq(Author.id, id)).get()

    if (!existingAuthor) {
      return c.json({ error: 'Author not found' }, 404)
    }

    // TODO: Check if author has any associated content before deleting
    // For now, we'll proceed with deletion

    // Delete the author from the database
    await db.delete(Author).where(eq(Author.id, id))

    return c.json({ message: 'Author deleted successfully' })
  } catch (error) {
    console.error('Error deleting author:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
