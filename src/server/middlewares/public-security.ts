import type { Context, Next } from 'hono'
import env from '../env'
import { aj } from '../lib/create-app'
export async function publicSecurityMiddleware(c: Context, next: Next) {
  // if (env.NODE_ENV !== 'production') {
  // 	await next()
  // } else {
  // 	const decision = await aj.protect(c.req.raw, { requested: 5 }) // Deduct 5 tokens from the bucket
  // 	if (decision.isDenied()) {
  // 		if (decision.reason.isRateLimit()) {
  // 			return c.json({ error: 'Too Many Requests' }, 429)
  // 		} else if (decision.reason.isBot()) {
  // 			return c.json({ error: 'No Bots Allowed' }, 403)
  // 		} else {
  // 			return c.json({ error: 'Forbidden' }, 403)
  // 		}
  // 	}
  // 	await next()
  // }
  await next()
}
