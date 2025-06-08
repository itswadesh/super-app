import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Author } from '../../../../db/schema'
import type { AuthorResponse } from '../types'

/**
 * Get an author by ID
 */
export async function getAuthorById(c: Context): Promise<Response> {
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

    // Fetch the author from the database
    const author = await db.select().from(Author).where(eq(Author.id, id)).get()

    if (!author) {
      return c.json({ error: 'Author not found' }, 404)
    }

    // Format the response
    const response: AuthorResponse = {
      ...author,
      qualifications: author.qualifications ? JSON.parse(author.qualifications) : [],
      achievements: author.achievements ? JSON.parse(author.achievements) : [],
      createdAt: new Date(author.createdAt).toISOString(),
      updatedAt: new Date(author.updatedAt).toISOString(),
    }

    return c.json(response)
  } catch (error) {
    console.error('Error fetching author:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
