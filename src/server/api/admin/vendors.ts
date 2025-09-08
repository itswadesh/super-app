import { Hono } from 'hono'
import { db } from '../../db'
import { Vendor, User } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { authenticateAdmin } from '../../middlewares'

export const vendorRoutes = new Hono()

// GET /api/admin/vendors - Get all vendor applications
vendorRoutes.get('/', authenticateAdmin, async (c) => {
  try {
    const vendors = await db
      .select({
        id: Vendor.id,
        userId: Vendor.userId,
        fullName: Vendor.fullName,
        email: Vendor.email,
        phone: Vendor.phone,
        experience: Vendor.experience,
        specializations: Vendor.specializations,
        kitchenEquipment: Vendor.kitchenEquipment,
        availableHours: Vendor.availableHours,
        deliveryRadius: Vendor.deliveryRadius,
        businessLicense: Vendor.businessLicense,
        foodSafetyCertificate: Vendor.foodSafetyCertificate,
        idProof: Vendor.idProof,
        address: Vendor.address,
        city: Vendor.city,
        pincode: Vendor.pincode,
        bankAccountNumber: Vendor.bankAccountNumber,
        bankName: Vendor.bankName,
        ifscCode: Vendor.ifscCode,
        upiId: Vendor.upiId,
        status: Vendor.status,
        reviewedBy: Vendor.reviewedBy,
        reviewNotes: Vendor.reviewNotes,
        reviewedAt: Vendor.reviewedAt,
        createdAt: Vendor.createdAt,
        updatedAt: Vendor.updatedAt,
        // Include user info
        userName: User.name,
        userPhone: User.phone,
        userEmail: User.email,
      })
      .from(Vendor)
      .leftJoin(User, eq(Vendor.userId, User.id))
      .orderBy(desc(Vendor.createdAt))

    return c.json(vendors)
  } catch (error) {
    console.error('Error fetching vendor applications:', error)
    return c.json({ error: 'Failed to fetch vendor applications' }, 500)
  }
})

// GET /api/admin/vendors/:id - Get specific vendor application
vendorRoutes.get('/:id', authenticateAdmin, async (c) => {
  try {
    const id = c.req.param('id')

    if (!id) {
      return c.json({ error: 'Vendor ID is required' }, 400)
    }

    const vendors = await db
      .select({
        id: Vendor.id,
        userId: Vendor.userId,
        fullName: Vendor.fullName,
        email: Vendor.email,
        phone: Vendor.phone,
        experience: Vendor.experience,
        specializations: Vendor.specializations,
        kitchenEquipment: Vendor.kitchenEquipment,
        availableHours: Vendor.availableHours,
        deliveryRadius: Vendor.deliveryRadius,
        businessLicense: Vendor.businessLicense,
        foodSafetyCertificate: Vendor.foodSafetyCertificate,
        idProof: Vendor.idProof,
        address: Vendor.address,
        city: Vendor.city,
        pincode: Vendor.pincode,
        bankAccountNumber: Vendor.bankAccountNumber,
        bankName: Vendor.bankName,
        ifscCode: Vendor.ifscCode,
        upiId: Vendor.upiId,
        status: Vendor.status,
        reviewedBy: Vendor.reviewedBy,
        reviewNotes: Vendor.reviewNotes,
        reviewedAt: Vendor.reviewedAt,
        createdAt: Vendor.createdAt,
        updatedAt: Vendor.updatedAt,
        // Include user info
        userName: User.name,
        userPhone: User.phone,
        userEmail: User.email,
      })
      .from(Vendor)
      .leftJoin(User, eq(Vendor.userId, User.id))
      .where(eq(Vendor.id, id))
      .limit(1)

    if (vendors.length === 0) {
      return c.json({ error: 'Vendor application not found' }, 404)
    }

    return c.json(vendors[0])
  } catch (error) {
    console.error('Error fetching vendor application:', error)
    return c.json({ error: 'Failed to fetch vendor application' }, 500)
  }
})

// PATCH /api/admin/vendors/:id - Update vendor application status
vendorRoutes.patch('/:id', authenticateAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const reviewedBy = c.get('user')?.id
    const body = await c.req.json()
    const { status, reviewNotes } = body
    if (!id) {
      return c.json({ error: 'Vendor ID is required' }, 400)
    }

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return c.json({ error: 'Valid status is required (approved, rejected, or pending)' }, 400)
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: sql`NOW()`,
    }

    if (reviewNotes !== undefined) {
      updateData.reviewNotes = reviewNotes
    }

    if (reviewedBy !== undefined) {
      updateData.reviewedBy = reviewedBy
    }

    // If approving or rejecting, set reviewedAt timestamp
    if (status === 'approved' || status === 'rejected') {
      updateData.reviewedAt = sql`NOW()`
    }

    const updatedVendor = await db
      .update(Vendor)
      .set(updateData)
      .where(eq(Vendor.id, id))
      .returning()

    if (updatedVendor.length === 0) {
      return c.json({ error: 'Vendor application not found' }, 404)
    }

    return c.json(updatedVendor[0])
  } catch (error) {
    console.error('Error updating vendor application:', error)
    return c.json({ error: 'Failed to update vendor application' }, 500)
  }
})

// GET /api/admin/vendors/stats - Get vendor statistics
vendorRoutes.get('/stats/summary', authenticateAdmin, async (c) => {
  try {
    const stats = await db
      .select({
        status: Vendor.status,
        count: sql<number>`count(*)`,
      })
      .from(Vendor)
      .groupBy(Vendor.status)

    const statsMap = stats.reduce(
      (acc, stat) => {
        if (stat.status) {
          acc[stat.status] = stat.count
        }
        return acc
      },
      {} as Record<string, number>
    )

    return c.json({
      total: stats.reduce((sum, stat) => sum + stat.count, 0),
      pending: statsMap.pending || 0,
      approved: statsMap.approved || 0,
      rejected: statsMap.rejected || 0,
    })
  } catch (error) {
    console.error('Error fetching vendor stats:', error)
    return c.json({ error: 'Failed to fetch vendor statistics' }, 500)
  }
})
