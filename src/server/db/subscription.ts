import { zValidator } from '@hono/zod-validator'
import { and, eq, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { db } from '.'
import { User, Plan, Order, subscriptions } from './schema'

type Variables = {
  userId?: string
  subscription?: Subscription
}

type Subscription = typeof subscriptions.$inferSelect
type NewSubscription = typeof subscriptions.$inferInsert

// Status values must match the database schema
const ACTIVE_STATUS = 'active'
const CANCELLED_STATUS = 'cancelled'

// Get user subscription status
export const getSubscription = async (c: Context<{ Variables: Variables }>) => {
  try {
    const userId = c.req.param('userId')

    if (!userId) {
      return c.json({ success: false, error: 'User ID is required' }, 400)
    }

    // Check if user exists
    const userExists = await db.query.User.findFirst({
      where: eq(User.id, userId),
    })

    if (!userExists) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    // Get active subscriptions
    const now = new Date()
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, ACTIVE_STATUS),
          lte(subscriptions.validFrom, now),
          gte(subscriptions.validTo, now)
        )
      )

    // For each subscription, get the plan details
    const subscriptionsWithPlans = await Promise.all(
      activeSubscriptions.map(async (sub) => {
        const plan = await db
          .select()
          .from(Plan)
          .where(eq(Plan.id, sub.planId))
          .then((plans) => plans[0] || null)

        return {
          ...sub,
          plan,
        }
      })
    )

    return c.json({
      success: true,
      hasActiveSubscription: subscriptionsWithPlans.length > 0,
      subscriptions: subscriptionsWithPlans,
    })
  } catch (error) {
    console.error('Error checking subscription:', error)
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      500
    )
  }
}

// Create a new subscription
const createSubscriptionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
  autoRenew: z.boolean().default(false),
})

const createSubscriptionHandler = async (c: Context<{ Variables: Variables }>) => {
  const data = await c.req.json()
  return handleCreateSubscription(c, data)
}

const handleCreateSubscription = async (
  c: Context<{ Variables: Variables }>,
  data: z.infer<typeof createSubscriptionSchema>
) => {
  try {
    const { userId, orderId, planId, validFrom = new Date(), validTo, autoRenew = false } = data

    // Verify that user, order and plan exist
    const [user, order, plan] = await Promise.all([
      db.query.User.findFirst({
        where: eq(User.id, userId),
      }),
      db.query.Order.findFirst({
        where: eq(Order.id, orderId),
      }),
      db.query.Plan.findFirst({
        where: eq(Plan.id, planId),
      }),
    ])

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    if (!order) {
      return c.json({ success: false, error: 'Order not found' }, 404)
    }

    if (!plan) {
      return c.json({ success: false, error: 'Plan not found' }, 404)
    }

    // Calculate validTo if not provided
    const calculatedValidTo = (() => {
      if (validTo) return validTo

      const baseDate = validFrom || new Date()
      const resultDate = new Date(baseDate)

      if (plan.validity) {
        resultDate.setDate(resultDate.getDate() + Number(plan.validity))
      } else {
        // Default to 1 year if no validity is set
        resultDate.setFullYear(resultDate.getFullYear() + 1)
      }

      return resultDate
    })()

    // Create new subscription
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId,
        orderId,
        planId,
        validFrom,
        validTo: calculatedValidTo,
        autoRenew,
        status: ACTIVE_STATUS,
      })
      .returning()

    if (!subscription) {
      throw new Error('Failed to create subscription')
    }

    return c.json({
      success: true,
      subscription: subscription as Subscription, // Add type casting here
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription',
      },
      500
    )
  }
}

// Cancel subscription
export const cancelSubscription = async (c: Context<{ Variables: Variables }>) => {
  try {
    const subscriptionId = c.req.param('subscriptionId')

    if (!subscriptionId) {
      return c.json({ success: false, error: 'Subscription ID is required' }, 400)
    }

    // First check if subscription exists
    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId),
    })

    if (!existingSub) {
      return c.json({ success: false, error: 'Subscription not found' }, 404)
    }

    // Don't allow cancelling already cancelled subscriptions
    if (existingSub.status === CANCELLED_STATUS) {
      return c.json({ success: false, error: 'Subscription is already cancelled' }, 400)
    }

    // Update subscription status
    const now = new Date()
    const updated = await db
      .update(subscriptions)
      .set({
        status: CANCELLED_STATUS,
        validTo: new Date(Math.min(existingSub.validTo.getTime(), now.getTime())), // Set validTo to now or keep the earlier date
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning()

    if (!updated[0]) {
      throw new Error('Failed to update subscription')
    }

    return c.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: updated[0] as Subscription, // Add type casting here
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      },
      500
    )
  }
}

// Create and export Hono router for subscription endpoints
// Define subscription routes
export const subscriptionRoutes = new Hono<{ Variables: Variables }>()
  .get('/:userId', (c) => getSubscription(c))
  .post('/', zValidator('json', createSubscriptionSchema), (c) => createSubscriptionHandler(c))
  .patch('/:subscriptionId', (c) => cancelSubscription(c))

// Export the subscription service for direct usage
export const subscriptionService = {
  getSubscription: (userId: string) =>
    db.query.subscriptions.findFirst({
      where: (subscriptions, { eq, and, gte, lte }) =>
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, ACTIVE_STATUS),
          lte(subscriptions.validFrom, new Date()),
          gte(subscriptions.validTo, new Date())
        ),
      with: {
        plan: true,
      },
    }),
  cancelSubscription: async (subscriptionId: string) => {
    const now = new Date()
    return db
      .update(subscriptions)
      .set({
        status: CANCELLED_STATUS,
        validTo: now,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning()
  },
  createSubscription: async (data: NewSubscription) => {
    return db.insert(subscriptions).values(data).returning()
  },
}

// Export types
export type { Subscription, NewSubscription }
