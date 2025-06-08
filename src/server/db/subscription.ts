import crypto from 'node:crypto';
import { zValidator } from '@hono/zod-validator';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '.';

// Define the Subscription schema since it's not in the original schema
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { User } from './schema';
import { Order } from './schema';
import { Plan } from './schema';

// Define the Subscription schema if it doesn't exist in the imported schema
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => User.id),
  order_id: text('order_id').notNull().references(() => Order.id),
  plan_id: text('plan_id').notNull().references(() => Plan.id),
  status: text('status').default('active'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  valid_from: integer('valid_from', { mode: 'timestamp' }).notNull(),
  valid_to: integer('valid_to', { mode: 'timestamp' }).notNull(),
  auto_renew: integer('auto_renew', { mode: 'boolean' }).default(false)
});

// Get user subscription status
export const GET = async (c) => {
  try {
    const userId = c.req.param('userId');

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    // Check if user exists
    const userExists = await db.query.User.findFirst({
      where: eq(User.id, userId)
    });

    if (!userExists) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get active subscriptions - using raw query since we just created the subscriptions table
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.user_id, userId),
        eq(subscriptions.status, 'active'),
        lte(sql`COALESCE(${subscriptions.valid_from}, 0)`, Math.floor(Date.now() / 1000)),
        gte(sql`COALESCE(${subscriptions.valid_to}, ${Number.MAX_SAFE_INTEGER})`, Math.floor(Date.now() / 1000))
      ));

    // For each subscription, get the plan details
    const subscriptionsWithPlans = await Promise.all(
      activeSubscriptions.map(async (sub) => {
        const plan = await db
          .select()
          .from(Plan)
          .where(eq(Plan.id, sub.plan_id))
          .then(plans => plans[0] || null);

        return {
          ...sub,
          plan
        };
      })
    );

    return c.json({
      success: true,
      hasActiveSubscription: subscriptionsWithPlans.length > 0,
      subscriptions: subscriptionsWithPlans
    });

  } catch (error) {
    console.error('Error checking subscription:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, 500);
  }
};

// Create a new subscription
const createSubscriptionSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  order_id: z.string().min(1, 'Order ID is required'),
  plan_id: z.string().min(1, 'Plan ID is required'),
  valid_from: z.number().optional(),
  valid_to: z.number().optional(),
  auto_renew: z.boolean().optional()
});

export const POST = zValidator('json', createSubscriptionSchema)(async (c) => {
  try {
    const data = await c.req.json();
    const {
      user_id,
      order_id,
      plan_id,
      valid_from = Math.floor(Date.now() / 1000),
      valid_to,
      auto_renew = false
    } = data;

    // Verify that user and plan exist
    const [users, plansFound] = await Promise.all([
      db.select().from(User).where(eq(User.id, user_id)),
      db.select().from(Plan).where(eq(Plan.id, plan_id))
    ]);

    const userExists = users.length > 0 ? users[0] : null;
    const planExists = plansFound.length > 0 ? plansFound[0] : null;

    if (!userExists) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (!planExists) {
      return c.json({ error: 'Plan not found' }, 404);
    }

    // Calculate valid_to if not provided
    let calculatedValidTo = valid_to;
    if (!calculatedValidTo && planExists.validity) {
      // Default is 1 year if not specified
      const validityInDays = planExists.validity.includes('month')
        ? Number.parseInt(planExists.validity) * 30
        : Number.parseInt(planExists.validity) * 365;

      calculatedValidTo = valid_from + (validityInDays * 24 * 60 * 60); // days to seconds
    }

    // Create new subscription with a generated ID
    const subscriptionId = crypto.randomUUID();
    const [subscription] = await db.insert(subscriptions).values({
      id: subscriptionId,
      user_id,
      order_id,
      plan_id,
      valid_from: valid_from,
      valid_to: calculatedValidTo,
      auto_renew: auto_renew, // Schema defines this as a boolean field
      status: 'active',
      created_at: sql`(strftime('%s', 'now'))`
    }).returning();

    return c.json({
      success: true,
      subscription
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    }, 500);
  }
};

// Cancel subscription
export const PATCH = async (c) => {
  try {
    // PATCH handler expects subscriptionId as a param
    const subscriptionId = c.req.param('subscriptionId');

    // First check if subscription exists
    const existingSubs = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId));

    if (existingSubs.length === 0) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    // Update subscription status
    const updated = await db.update(subscriptions)
      .set({
        status: 'cancelled'
        // Removed updated_at as it's not in the schema definition
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    return c.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: updated[0]
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    }, 500);
  }
});
