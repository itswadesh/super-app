import { Hono } from 'hono'
import { db } from '../db'
import { Vendor, User } from '../db/schema'
import { eq } from 'drizzle-orm'
import { authenticate } from '../middlewares'

export const routes = new Hono()

// Create a new application
routes.post('/', authenticate, async (c) => {
  try {
    const body = await c.req.json()
    const { fullName, businessName, phone, address } = body

    // Validate required fields
    if (!fullName || !fullName.trim()) {
      return c.json({ error: 'Full name is required' }, 400)
    }

    if (!businessName || !businessName.trim()) {
      return c.json({ error: 'Business name is required' }, 400)
    }

    if (!phone || !phone.trim()) {
      return c.json({ error: 'Business phone number is required' }, 400)
    }

    if (!address || !address.trim()) {
      return c.json({ error: 'Address is required' }, 400)
    }

    // TODO: Get actual user ID from authentication
    const userId = c.get('user')?.id

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

    // Get user's email from the User table to store in Vendor
    const userData = await db
      .select({ email: User.email })
      .from(User)
      .where(eq(User.id, userId))
      .limit(1)

    const userEmail =
      userData.length > 0 && userData[0].email ? userData[0].email : 'placeholder@example.com'

    // Create new application with complete form data
    const newApplication = await db
      .insert(Vendor)
      .values({
        userId,
        fullName: fullName.trim(),
        email: userEmail, // Use user's email from User table
        phone: phone.trim(),
        address: address.trim(),
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
routes.get('/status', authenticate, async (c) => {
  try {
    const userId = c.get('user')?.id
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
