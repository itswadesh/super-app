import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Author } from '../../../../db/schema'
import type { CreateAuthorRequest } from '../types'

/**
 * Create a new author
 */
export async function createAuthor(c: Context): Promise<Response> {
  try {
    // Validate session
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Parse and validate request body
    const data = await c.req.json<CreateAuthorRequest>()

    if (!data.name) {
      return c.json({ error: 'Name is required' }, 400)
    }

    // Check if author with the same name already exists
    const existingAuthor = await db.select().from(Author).where(eq(Author.name, data.name)).get()

    if (existingAuthor) {
      return c.json({ error: 'An author with this name already exists' }, 409)
    }

    // Create the new author
    const now = new Date()
    const newAuthor = {
      id: crypto.randomUUID(),
      name: data.name,
      avatar: data.avatar || null,
      bio: data.bio || null,
      qualifications: data.qualifications ? JSON.stringify(data.qualifications) : '[]',
      achievements: data.achievements ? JSON.stringify(data.achievements) : '[]',
      website: data.website || null,
      twitter: data.twitter || null,
      linkedin: data.linkedin || null,
      instagram: data.instagram || null,
      joinedDate: now,
      createdAt: now,
      updatedAt: now,
    }

    // Insert into database
    await db.insert(Author).values(newAuthor)

    // Return the created author
    return c.json(
      {
        ...newAuthor,
        qualifications: JSON.parse(newAuthor.qualifications),
        achievements: JSON.parse(newAuthor.achievements),
        createdAt: newAuthor.createdAt.toISOString(),
        updatedAt: newAuthor.updatedAt.toISOString(),
      },
      201
    )
  } catch (error) {
    console.error('Error creating author:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
