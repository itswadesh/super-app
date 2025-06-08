import { and, eq, sql } from 'drizzle-orm'
import type { Context } from 'hono'
import { db } from '../../db'
import { ErrorLog } from '../../db/schema'

// Define type for error update requests
export interface ErrorUpdateBody {
  isViewed?: boolean
  isIgnored?: boolean
  ignoredReason?: string
}

// Error controllers
export const errorControllers = {
  // Get error statistics (counts by category)
  getErrorStats: async (c: Context) => {
    try {
      // Get counts of errors by category
      const categories = await db
        .select({
          category: ErrorLog.category,
          count: sql`count(*)`.mapWith(Number),
        })
        .from(ErrorLog)
        .where(eq(ErrorLog.isIgnored, false))
        .groupBy(ErrorLog.category)

      // Get total error count
      const [{ total }] = await db
        .select({
          total: sql`count(*)`.mapWith(Number),
        })
        .from(ErrorLog)
        .where(eq(ErrorLog.isIgnored, false))

      return c.json({ categories, total })
    } catch (err) {
      await console.log('API:GET:/api/admin/errors/stats', 'Failed to fetch error statistics', err)
      return c.json({ categories: [], total: 0, error: 'Failed to fetch error statistics' }, 500)
    }
  },
  // Get all errors with filters for ignored status and category
  getErrors: async (c: Context) => {
    try {
      // Parse query parameters
      const url = new URL(c.req.url)
      const showIgnored = url.searchParams.get('ignored') === 'true'
      const category = url.searchParams.get('category')

      // Build conditions array for filters
      const conditions = []

      // Add ignored status filter
      if (showIgnored) {
        conditions.push(eq(ErrorLog.isIgnored, true))
      } else {
        conditions.push(eq(ErrorLog.isIgnored, false))
      }

      // Add category filter if provided
      if (category) {
        conditions.push(eq(ErrorLog.category, category))
      }

      // Build query with all conditions
      const query = db
        .select()
        .from(ErrorLog)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0])

      // Get ordered results
      const errors = await query.orderBy(ErrorLog.lastSeen)
      return c.json({ errors })
    } catch (err) {
      await console.log('API:GET:/api/admin/errors', 'Failed to fetch error logs', err)
      return c.json({ errors: [], error: 'Failed to fetch error logs' }, 500)
    }
  },

  // Delete all errors
  clearErrors: async (c: Context) => {
    try {
      await db.delete(ErrorLog)
      return c.json({ success: true })
    } catch (err) {
      await console.log('API:DELETE:/api/admin/errors', 'Failed to delete all error logs', err)
      return c.json({ success: false, error: 'Failed to delete error logs' }, 500)
    }
  },

  // Get specific error
  getError: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const [error] = await db
        .select()
        .from(ErrorLog)
        .where(eq(ErrorLog.id, id || ''))

      if (!error) {
        return c.json({ error: 'Error log not found' }, 404)
      }

      return c.json({ error })
    } catch (err) {
      await console.log('API:GET:/api/admin/errors/:id', 'Failed to fetch error log', err)
      return c.json({ error: 'Failed to fetch error log' }, 500)
    }
  },

  // Update error (mark as viewed/ignored)
  updateError: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const body = (await c.req.json()) as ErrorUpdateBody

      // Only allow specific fields to be updated
      const updateData: ErrorUpdateBody = {}
      if (typeof body.isViewed !== 'undefined') updateData.isViewed = body.isViewed
      if (typeof body.isIgnored !== 'undefined') updateData.isIgnored = body.isIgnored
      if (body.ignoredReason) updateData.ignoredReason = body.ignoredReason

      // Perform the update
      await db
        .update(ErrorLog)
        .set(updateData)
        .where(eq(ErrorLog.id, id || ''))

      return c.json({ success: true })
    } catch (err) {
      await console.log('API:PATCH:/api/admin/errors/:id', 'Failed to update error log', err)
      return c.json({ success: false, error: 'Failed to update error log' }, 500)
    }
  },

  // Delete specific error
  deleteError: async (c: Context) => {
    try {
      const id = c.req.param('id')

      // Perform the delete
      await db.delete(ErrorLog).where(eq(ErrorLog.id, id || ''))

      return c.json({ success: true })
    } catch (err) {
      await console.log('API:DELETE:/api/admin/errors/:id', 'Failed to delete error log', err)
      return c.json({ success: false, error: 'Failed to delete error log' }, 500)
    }
  },
}
