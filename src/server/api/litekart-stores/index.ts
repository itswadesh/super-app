import { Hono } from 'hono'
import type { Context } from 'hono'
import { getSessionTokenCookie, validateSessionToken } from '../../db/auth'
import postgres from 'postgres'

export const litekartStoreRoutes = new Hono()

// Function to execute the query for a single database
async function fetchStoreMetrics(pgUri: string) {
  const sql = postgres(pgUri)
  try {
    return await sql`WITH store_metrics AS ( SELECT 
        s.id as store_id,
        s.name as store_name,
        s.country,
        s.currency currency_code,
        -- Order metrics
        COUNT(DISTINCT o.id) as no_of_orders,
        MAX(o.created_at) as last_order_date,
        ROUND(SUM(o.amount_paid)/100) as total_payment_amount,
        -- Date parts for grouping
        DATE_TRUNC('month', o.created_at) as month
    FROM 
        store s
    LEFT JOIN 
        "order" o ON s.id = o.store_id
    GROUP BY 
        s.id, s.name, s.country, s.currency, DATE_TRUNC('month', o.created_at)
),
currency_rates AS (
    SELECT 
        code,
        rate_to_inr
    FROM 
        currency_rates
    WHERE 
        code IN (SELECT DISTINCT currency_code FROM store_metrics)
)
SELECT 
    sm.store_name,
    sm.country,
     SUM(COALESCE(sm.no_of_orders, 0)) as total_orders,
    ROUND(SUM(COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0))) as total_amount_inr,
    -- Overall totals
    MAX(sm.last_order_date) as last_order_date,
    -- January metrics
    CONCAT(
        ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 1 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END)),
       -- sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 1 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as jan,
    
    -- February metrics
    CONCAT(
        ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 2 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END)),
        -- sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 2 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as feb,
    
    -- March metrics
    CONCAT(
        ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 3 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END)),
      --  sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 3 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as mar,
    
    -- April metrics
    CONCAT(
        ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 4 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END)),
      --  sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 4 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as apr,
    
    -- May metrics
    CONCAT(
        ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 5 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END)),
       -- sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 5 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as may,
    
    -- June metrics
    CONCAT(
        ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 6 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END)),
     --   sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 6 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as jun,
    
    -- July metrics
    CONCAT(
        ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 7 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END)),
      --  sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 7 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as jul,
    
    -- August metrics
    CONCAT(
        ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 8 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END)),
      --  sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 8 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as aug,
    
    -- September metrics
    CONCAT(
        ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 9 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END)),
     --   sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 9 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as sep,
    
    -- October metrics
    CONCAT(
        ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 10 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END)),
      --  sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 10 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as oct,
    
    -- November metrics
    CONCAT(
        ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 11 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END)),
      --  sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 11 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as nov,
    
    -- December metrics
    CONCAT(
        ROUND(ROUND(SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 12 THEN COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0) ELSE 0 END))),
     --   sm.currency_code,
        ' (',
        SUM(CASE WHEN EXTRACT(MONTH FROM sm.month) = 12 THEN COALESCE(sm.no_of_orders, 0) ELSE 0 END),
        ')'
    ) as dec
    
FROM 
    store_metrics sm
LEFT JOIN 
    currency_rates cr ON sm.currency_code = cr.code
GROUP BY 
    sm.store_name, sm.country, sm.currency_code
ORDER BY 
    sm.store_name;`
  } catch (error) {
    console.error(`Error querying database: ${pgUri}`, error)
    return []
  } finally {
    await sql.end()
  }
}

// GET /api/litekart-stores - Get store metrics from multiple databases
litekartStoreRoutes.get('/', async (c: Context) => {
  try {
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')

    // Dynamically get all PG_URI_* environment variables
    const pgUris = Object.entries(process.env)
      .filter(([key]) => key.startsWith('PG_URI_'))
      .map(([_, value]) => value)
      .filter((value): value is string => Boolean(value))

    if (pgUris.length === 0) {
      return c.json(
        {
          success: false,
          message: 'No database connections configured',
        },
        500
      )
    }

    // Execute queries in parallel
    const allResults = await Promise.all(pgUris.map((uri) => fetchStoreMetrics(uri)))
    // Flatten and concatenate all results
    const storeMetrics = allResults.flat()

    if (storeMetrics.length === 0) {
      return c.json({
        success: true,
        data: [],
        message: 'No products available',
      })
    }

    return c.json({
      success: true,
      data: storeMetrics,
    })
  } catch (err) {
    console.error('Error searching products:', err)
    return c.json(
      {
        success: false,
        error: 'Failed to search for products',
      },
      500
    )
  }
})

// Export the routes
export default litekartStoreRoutes
