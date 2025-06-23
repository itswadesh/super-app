import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Author } from '../../../../db/schema'
import type { UpdateAuthorRequest } from '../types'

/**
 * Update an author by ID
 */
export async function updateAuthor(c: Context): Promise<Response> {
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

    // Parse and validate request body
    const data = await c.req.json<UpdateAuthorRequest>()

    // Check if author exists
    const existingAuthor = await db.select().from(Author).where(eq(Author.id, id)).get()

    if (!existingAuthor) {
      return c.json({ error: 'Author not found' }, 404)
    }

    // Check if another author with the same name already exists
    if (data.name && data.name !== existingAuthor.name) {
      const duplicateAuthor = await db.select().from(Author).where(eq(Author.name, data.name)).get()

      if (duplicateAuthor) {
        return c.json({ error: 'An author with this name already exists' }, 409)
      }
    }

    // Prepare the update data
    const now = new Date()
    const updateData = {
      name: data.name !== undefined ? data.name : existingAuthor.name,
      avatar: data.avatar !== undefined ? data.avatar : existingAuthor.avatar,
      bio: data.bio !== undefined ? data.bio : existingAuthor.bio,
      qualifications:
        data.qualifications !== undefined
          ? JSON.stringify(data.qualifications)
          : existingAuthor.qualifications,
      achievements:
        data.achievements !== undefined
          ? JSON.stringify(data.achievements)
          : existingAuthor.achievements,
      website: data.website !== undefined ? data.website : existingAuthor.website,
      twitter: data.twitter !== undefined ? data.twitter : existingAuthor.twitter,
      linkedin: data.linkedin !== undefined ? data.linkedin : existingAuthor.linkedin,
      instagram: data.instagram !== undefined ? data.instagram : existingAuthor.instagram,
      updatedAt: now,
    }

    // Update the author in the database
    await db.update(Author).set(updateData).where(eq(Author.id, id))

    // Fetch the updated author
    const updatedAuthor = await db.select().from(Author).where(eq(Author.id, id)).get()

    // Format the response
    return c.json({
      ...updatedAuthor,
      qualifications: updatedAuthor.qualifications ? JSON.parse(updatedAuthor.qualifications) : [],
      achievements: updatedAuthor.achievements ? JSON.parse(updatedAuthor.achievements) : [],
      createdAt: new Date(updatedAuthor.createdAt).toISOString(),
      updatedAt: new Date(updatedAuthor.updatedAt).toISOString(),
    })
  } catch (error) {
    console.error('Error updating author:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
