import { Hono } from 'hono'
import { db } from '../db'
import { Vendor } from '../db/schema'
import { eq } from 'drizzle-orm'

export const routes = new Hono()

// Create a new application
routes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { businessName } = body

    if (!businessName || !businessName.trim()) {
      return c.json({ error: 'Business name is required' }, 400)
    }

    // TODO: Get actual user ID from authentication
    const userId = 'a3bdbc50-a7cb-43bb-9ad5-469a5810788b' // Test user ID

    // Check if user already has a pending or approved application
    const existingApplication = await db
      .select()
      .from(Vendor)
      .where(eq(Vendor.userId, userId))
      .limit(1)

    if (existingApplication.length > 0) {
      const app = existingApplication[0]
      if (app.status === 'pending') {
        return c.json({ error: 'You already have a pending application' }, 400)
      } else if (app.status === 'approved') {
        return c.json({ error: 'You are already approved as a host' }, 400)
      }
    }

    // Create new application with required fields
    // Map businessName to fullName and provide defaults for other required fields
    const newApplication = await db
      .insert(Vendor)
      .values({
        userId,
        fullName: businessName.trim(), // Map businessName to fullName
        email: 'placeholder@example.com', // TODO: Get from user auth
        phone: '0000000000', // TODO: Get from user profile
        address: 'To be updated', // TODO: Collect in full application form
        idProof: 'pending', // TODO: Collect in full application form
        status: 'pending',
      })
      .returning()

    return c.json(newApplication[0], 201)
  } catch (error) {
    console.error('Error creating application:', error)
    return c.json({ error: 'Failed to create application' }, 500)
  }
})

// Get user's application status
routes.get('/status', async (c) => {
  try {
    // TODO: Get actual user ID from authentication
    const userId = 'a3bdbc50-a7cb-43bb-9ad5-469a5810788b' // Test user ID

    const application = await db.select().from(Vendor).where(eq(Vendor.userId, userId)).limit(1)

    if (application.length === 0) {
      return c.json(null)
    }

    return c.json(application[0])
  } catch (error) {
    console.error('Error fetching application status:', error)
    return c.json({ error: 'Failed to fetch application status' }, 500)
  }
})
