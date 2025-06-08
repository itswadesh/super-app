// import { notFound, serveEmojiFavicon } from 'stoker/middlewares'
// import arcjet, { detectBot, shield, tokenBucket } from '@arcjet/node'

// import type { AppBindings, AppOpenAPI } from './types'
// import { pinoLogger } from '../middlewares/pino-logger'
// import { validateDomainToken, validateToken, verifyRole } from '../utils'
// import { Hono } from 'hono'

// export const aj = arcjet({
// 	key: process.env.ARCJET_KEY!,
// 	characteristics: ['ip.src'], // Track requests by IP
// 	rules: [
// 		// Shield protects your app from common attacks e.g. SQL injection
// 		shield({ mode: 'LIVE' }),
// 		// Create a bot detection rule
// 		detectBot({
// 			mode: 'LIVE', // Blocks requests. Use "DRY_RUN" to log only
// 			// Block all bots except the following
// 			allow: [
// 				'CATEGORY:SEARCH_ENGINE' // Google, Bing, etc
// 				// Uncomment to allow these other common bot categories
// 				// See the full list at https://arcjet.com/bot-list
// 				//"CATEGORY:MONITOR", // Uptime monitoring services
// 				//"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
// 			]
// 		}),
// 		// Create a token bucket rate limit. Other algorithms are supported.
// 		tokenBucket({
// 			mode: 'LIVE',
// 			refillRate: 5, // Refill 5 tokens per interval
// 			interval: 1, // Refill every 1 seconds
// 			capacity: 10 // Bucket capacity of 10 tokens
// 		})
// 	]
// })

// export function createRouter() {
// 	return new Hono<AppBindings>({
// 		strict: false,
// 	})
// }

// export default function createApp() {
// 	const app = createRouter()
// 	app.use(serveEmojiFavicon('📝'))
// 	app.use(pinoLogger())
// 	app.use('/api/admin/*', validateToken)
// 	app.use(validateDomainToken)
// 	app.use('/api/admin/*', verifyRole)
// 	app.notFound(notFound)
// 	app.onError(onError)
// 	return app
// }

// export function createTestApp<R extends AppOpenAPI>(router: R) {
// 	return createApp().route('/', router)
// }
