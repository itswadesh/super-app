import { Hono } from 'hono'
import type { Context } from 'hono'
import { getSessionTokenCookie, validateSessionToken } from '../../db/auth'
import postgres, { type Row } from 'postgres'

interface StoreMetric extends Row {
  store_id: string
  store_name: string
  country: string
  total_orders: number
  total_amount_inr: number
  last_order_date: Date | null
  currency_code: string
  rate: number
  jan: string
  feb: string
  mar: string
  apr: string
  may: string
  jun: string
  jul: string
  aug: string
  sep: string
  oct: string
  nov: string
  dec: string
  db_name: string
  envKey?: string
}

export const litekartStoreRoutes = new Hono()

// Function to execute the query for a single database
async function fetchStoreMetrics(pgUri: string): Promise<StoreMetric[]> {
  const sql = postgres(pgUri)
  // Extract dbName from the connection string for identification
  const dbName = pgUri.split('/').pop() || 'unknown'
  try {
    // Execute query and return results with proper typing
    const results: StoreMetric[] = await sql`
      WITH store_metrics AS (
        SELECT 
          s.id as store_id,
          s.name as store_name,
          s.country,
          s.currency as currency_code,
        -- Order metrics
        COUNT(DISTINCT o.id) as no_of_orders,
        MAX(o.created_at) as last_order_date,
        ROUND(SUM(o.amount_paid)/100) as total_payment_amount,
        ${dbName} as db_name, -- Database name for identification
        -- Date parts for grouping
        DATE_TRUNC('month', o.created_at) as month
    FROM 
        store s
    LEFT JOIN 
        "order" o ON s.id = o.store_id AND o.paid = true
    GROUP BY 
        s.id, s.name, s.country, s.currency, DATE_TRUNC('month', o.created_at)
),
currency_exchange AS (
    SELECT 
        from_currency code,
        rate rate_to_inr
    FROM 
        currency_exchange
    WHERE 
        from_currency IN (SELECT DISTINCT currency_code FROM store_metrics)
        and to_currency = 'INR'
        and effective_from <= CURRENT_DATE
        and effective_to >= CURRENT_DATE
)
SELECT 
    sm.store_id,
    sm.store_name,
    ${pgUri} as db_name,
    sm.country,
     SUM(COALESCE(sm.no_of_orders, 0)) as total_orders,
    ROUND(SUM(COALESCE(sm.total_payment_amount * cr.rate_to_inr, 0))) as total_amount_inr,
    -- Overall totals
    MAX(sm.last_order_date) as last_order_date,
    sm.currency_code as currency_code,
    cr.rate_to_inr as rate,
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
    currency_exchange cr ON sm.currency_code = cr.code
GROUP BY 
    sm.store_id, sm.store_name, sm.country, sm.currency_code, cr.rate_to_inr
ORDER BY 
    sm.store_name;`

    return results
  } catch (error) {
    console.error(`Error fetching store metrics from ${pgUri}:`, error)
    return []
  } finally {
    // Close the database connection
    await sql.end()
  }
}

// GET /api/litekart-stores - Get store metrics from multiple databases
litekartStoreRoutes.get('/', async (c: Context) => {
  try {
    // Validate session but we don't need the session object
    const sessionToken = getSessionTokenCookie(c)
    await validateSessionToken(sessionToken || '')

    // Get all PG_URI_* environment variables with both keys and values
    const pgConfigs = Object.entries(process.env)
      .filter(([key]) => key.startsWith('PG_URI_'))
      .map(([key, value]) => ({
        key,
        uri: value as string,
      }))
      .filter((config) => Boolean(config.uri))

    if (pgConfigs.length === 0) {
      return c.json(
        {
          success: false,
          message: 'No database connections configured',
        },
        500
      )
    }

    // Execute queries in parallel and include the env key with each result
    const storeMetrics = (
      await Promise.all(
        pgConfigs.map(async ({ key, uri }) => {
          const metrics = await fetchStoreMetrics(uri)
          return metrics.map((metric) => ({
            ...metric,
            db_name: key,
          }))
        })
      )
    ).flat()

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
litekartStoreRoutes.get('/daily-sales', async (c: Context) => {
  const sessionToken = getSessionTokenCookie(c)
  const session = await validateSessionToken(sessionToken || '')

  const { db_name: dbName } = c.req.query()
  if (!dbName) {
    return c.json(
      {
        success: false,
        message: 'Database name required',
      },
      400
    )
  }
  // Dynamically get all PG_URI_* environment variables
  const pgUri = process.env[dbName]

  if (!pgUri) {
    return c.json(
      {
        success: false,
        message: 'No database connections configured',
      },
      500
    )
  }
  // month and year are not currently used in the query
  const sql = postgres(pgUri)

  try {
    const data = await sql`SELECT 
    s.id as store_id,
    s.name as store_name,
    s.country,
    s.currency as currency_code,
    DATE(o.created_at) as order_date,
    COUNT(DISTINCT o.id) as no_of_orders,
    ROUND(SUM(o.amount_paid)) as total_payment_amount,
    ROUND(SUM(COALESCE(o.amount_paid * cr.rate, 0)/100)) as total_amount_inr
FROM 
    store s
LEFT JOIN 
    "order" o ON s.id = o.store_id AND o.paid = true
LEFT JOIN 
    currency_exchange cr ON s.currency = cr.from_currency
WHERE 
    TO_CHAR(o.created_at, 'MON') = 'JUL'
GROUP BY 
    s.id, s.name, s.country, s.currency, DATE(o.created_at)
ORDER BY 
    s.id, order_date`
    return c.json(data)
  } catch (err) {
    console.error('Error fetching store metrics:', err)
    return c.json(
      {
        success: false,
        error: 'Failed to fetch store metrics',
      },
      500
    )
  } finally {
    await sql.end()
  }
})
// Export the routes
export default litekartStoreRoutes
