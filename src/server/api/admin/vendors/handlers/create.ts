import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../../../db'
import { getSessionTokenCookie, validateSessionToken } from '../../../../db/auth'
import { Vendor } from '../../../../db/schema'
import type { CreateVendorRequest } from '../types'

/**
 * Create a new vendor
 */
export async function createVendor(c: Context): Promise<Response> {
  try {
    // Validate session
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Parse and validate request body
    const data = await c.req.json<CreateVendorRequest>()

    if (!data.businessName) {
      return c.json({ error: 'Business Name is required' }, 400)
    }

    // Check if vendor with the same name already exists
    const result = await db
      .select()
      .from(Vendor)
      .where(eq(Vendor.businessName, data.businessName))
      .limit(1)
    const existingVendor = result[0]

    if (existingVendor) {
      return c.json({ error: 'A vendor with this name already exists' }, 409)
    }

    // Create the new vendor
    const now = new Date()
    const newVendor = {
      id: crypto.randomUUID(),
      businessName: data.businessName,
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
    await db.insert(Vendor).values(newVendor)

    // Return the created vendor
    return c.json(
      {
        ...newVendor,
        qualifications: JSON.parse(newVendor.qualifications),
        achievements: JSON.parse(newVendor.achievements),
        createdAt: newVendor.createdAt.toISOString(),
        updatedAt: newVendor.updatedAt.toISOString(),
      },
      201
    )
  } catch (error) {
    console.error('Error creating author:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
