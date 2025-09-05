import { Hono } from 'hono'
import { db } from '../../../server/db'
import { Vendor } from '../../../server/db/schema'
import { eq } from 'drizzle-orm'

const routes = new Hono()

// Get all applications (admin only)
routes.get('/', async (c) => {
  try {
    const applications = await db.select().from(Vendor).orderBy(Vendor.createdAt)

    return c.json(applications)
  } catch (error) {
    console.error('Error fetching applications:', error)
    return c.json({ error: 'Failed to fetch applications' }, 500)
  }
})

// Get application by ID
routes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const applications = await db.select().from(Vendor).where(eq(Vendor.id, id))

    if (applications.length === 0) {
      return c.json({ error: 'Application not found' }, 404)
    }

    return c.json(applications[0])
  } catch (error) {
    console.error('Error fetching application:', error)
    return c.json({ error: 'Failed to fetch application' }, 500)
  }
})

// Create new application
routes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const {
      userId,
      fullName,
      email,
      phone,
      experience,
      specializations,
      kitchenEquipment,
      availableHours,
      deliveryRadius,
      businessLicense,
      foodSafetyCertificate,
      idProof,
      address,
      city,
      pincode,
      bankAccountNumber,
      bankName,
      ifscCode,
      upiId,
    } = body

    // Validate required fields
    if (!userId || !fullName || !email || !phone || !address || !idProof) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    // Check if user already has an application
    const existingApplication = await db
      .select()
      .from(Vendor)
      .where(eq(Vendor.userId, userId))
      .limit(1)

    if (existingApplication.length > 0) {
      return c.json({ error: 'User already has an application' }, 400)
    }

    const newApplication = await db
      .insert(Vendor)
      .values({
        userId,
        fullName,
        email,
        phone,
        experience,
        specializations,
        kitchenEquipment,
        availableHours,
        deliveryRadius,
        businessLicense,
        foodSafetyCertificate,
        idProof,
        address,
        city,
        pincode,
        bankAccountNumber,
        bankName,
        ifscCode,
        upiId,
      })
      .returning()

    return c.json(newApplication[0], 201)
  } catch (error) {
    console.error('Error creating application:', error)
    return c.json({ error: 'Failed to create application' }, 500)
  }
})

// Update application status (admin only)
routes.patch('/:id/status', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { status, reviewNotes, reviewedBy } = body

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }

    const updateData: any = {
      status,
      reviewedAt: new Date(),
    }

    if (reviewNotes) updateData.reviewNotes = reviewNotes
    if (reviewedBy) updateData.reviewedBy = reviewedBy

    const updatedApplication = await db
      .update(Vendor)
      .set(updateData)
      .where(eq(Vendor.id, id))
      .returning()

    if (updatedApplication.length === 0) {
      return c.json({ error: 'Application not found' }, 404)
    }

    return c.json(updatedApplication[0])
  } catch (error) {
    console.error('Error updating application status:', error)
    return c.json({ error: 'Failed to update application status' }, 500)
  }
})

// Delete application
routes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const deletedApplication = await db.delete(Vendor).where(eq(Vendor.id, id)).returning()

    if (deletedApplication.length === 0) {
      return c.json({ error: 'Application not found' }, 404)
    }

    return c.json({ message: 'Application deleted successfully' })
  } catch (error) {
    console.error('Error deleting application:', error)
    return c.json({ error: 'Failed to delete application' }, 500)
  }
})

export { routes as GET, routes as POST, routes as PATCH, routes as DELETE }
