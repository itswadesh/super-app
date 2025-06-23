import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { db } from '../../../db'
import { ErrorLog } from '../../../db/schema'

/**
 * Error logging interface
 */
interface ErrorLogInput {
  source: string
  message: string
  details?: any
  category?: string
}

/**
 * Setup Hono router for the error logger API
 */
export const errorLoggerRouter = new Hono()

/**
 * POST endpoint to log an error
 */
errorLoggerRouter.post('/', async (c) => {
  try {
    // Get error data from request body
    const { source, message, details, category = 'general' } = await c.req.json<ErrorLogInput>()

    // Create a fingerprint for the error (source + message combination)
    const errorFingerprint = `${source}:${message}`

    // Check if this error has been logged before
    const existingErrors = await db
      .select()
      .from(ErrorLog)
      .where(eq(ErrorLog.fingerprint, errorFingerprint))

    const now = new Date()
    let errorId: string

    if (existingErrors.length > 0) {
      // Error exists, update occurrence count and last seen timestamp
      const existingError = existingErrors[0]
      errorId = existingError.id

      await db
        .update(ErrorLog)
        .set({
          occurrences: existingError.occurrences + 1,
          lastSeen: now,
          details: details ? JSON.stringify(details) : existingError.details,
          category: category || existingError.category || 'general',
        })
        .where(eq(ErrorLog.id, errorId))
    } else {
      // New error, create a new record
      errorId = crypto.randomUUID()
      await db.insert(ErrorLog).values({
        id: errorId,
        fingerprint: errorFingerprint,
        source,
        message,
        details: details ? JSON.stringify(details) : null,
        category,
        occurrences: 1,
        firstSeen: now,
        lastSeen: now,
      })
    }

    return c.json({ success: true, errorId })
  } catch (dbError) {
    // Fallback to console if database logging fails
    console.error('Error Logger Failed:', dbError)
    return c.json({ success: false, error: 'Failed to log error' }, 500)
  }
})

/**
 * API endpoint to log specific API errors
 */
errorLoggerRouter.post('/api', async (c) => {
  try {
    const { method, url, error } = await c.req.json()
    const source = `API:${method}:${url}`
    const message = typeof error === 'string' ? error : error.message || 'Unknown error'

    // Forward to the main error logging endpoint
    const response = await fetch(`${new URL(c.req.url).origin}/api/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        message,
        details: error,
        category: 'api',
      }),
    })

    const result = await response.json()
    return c.json(result)
  } catch (err) {
    console.error('API Error Logger Failed:', err)
    return c.json({ success: false, error: 'Failed to log API error' }, 500)
  }
})

/**
 * Client helper class that provides a familiar interface
 * This is for backward compatibility with existing code
 */
export class ErrorLogger {
  /**
   * Log an error to the database
   */
  static async log(
    source: string,
    message: string,
    details?: any,
    category = 'general'
  ): Promise<void> {
    try {
      // If running in browser, use fetch to call the API endpoint
      if (typeof window !== 'undefined') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source, message, details, category }),
        })
        return
      }

      // Direct database access for server-side code
      const errorFingerprint = `${source}:${message}`
      const existingErrors = await db
        .select()
        .from(ErrorLog)
        .where(eq(ErrorLog.fingerprint, errorFingerprint))

      const now = new Date()

      if (existingErrors.length > 0) {
        // Update existing error
        const existingError = existingErrors[0]
        await db
          .update(ErrorLog)
          .set({
            occurrences: existingError.occurrences + 1,
            lastSeen: now,
            details: details ? JSON.stringify(details) : existingError.details,
            category: category || existingError.category || 'general',
          })
          .where(eq(ErrorLog.id, existingError.id))
      } else {
        // Create new error record
        const errorId = crypto.randomUUID()
        await db.insert(ErrorLog).values({
          id: errorId,
          fingerprint: errorFingerprint,
          source,
          message,
          details: details ? JSON.stringify(details) : null,
          category,
          occurrences: 1,
          firstSeen: now,
          lastSeen: now,
        })
      }
    } catch (dbError) {
      // Fallback to console if database logging fails
      console.error('Error Logger Failed:', dbError)
      console.error('Original Error:', { source, message, details })
    }
  }

  /**
   * Log an API error
   */
  static async logApiError(method: string, url: string, error: any): Promise<void> {
    const source = `API:${method}:${url}`
    const message = typeof error === 'string' ? error : error.message || 'Unknown error'
    await this.log(source, message, error, 'api')
  }

  /**
   * Log a client-side error
   */
  static async logClientError(componentName: string, error: any): Promise<void> {
    const source = `Client:${componentName}`
    const message = typeof error === 'string' ? error : error.message || 'Unknown error'
    await this.log(source, message, error, 'frontend')
  }
}
