/**
 * Server hooks for SvelteKit to add proper auth handling and caching headers
 * This ensures static assets are cached efficiently by Cloudflare
 */
import type { Handle } from '@sveltejs/kit'
// import * as auth from './server/db/auth.js';

/**
 * Combined handler for authentication and Cloudflare caching
 */
export const handle: Handle = async ({ event, resolve }) => {
  if (!event.url.pathname.startsWith('/api/')) {
    const { session, user } = await event.fetch('/api/auth/me').then((res) => res.json())
    if (session && user) {
      event.locals.user = user
      event.locals.session = session
    }
  }

  // ------------- Response & Caching Handling -------------
  const response = await resolve(event)

  // Get the request URL path
  const path = event.url.pathname

  // Add cache headers for static assets
  if (
    // JavaScript files
    path.match(/\.(js)$/i) ||
    // CSS files
    path.match(/\.(css)$/i) ||
    // Image files
    path.match(/\.(jpe?g|png|gif|webp|avif|svg)$/i) ||
    // Font files
    path.match(/\.(woff2?|eot|ttf|otf)$/i) ||
    // Other static assets worth caching
    path.match(/\.(ico|json|webmanifest)$/i) ||
    // If assets are in _app directory (common in SvelteKit)
    path.startsWith('/_app/')
  ) {
    // Set a long cache time for static assets (1 year)
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  // For HTML and other dynamic content, use a shorter cache with validation
  // Skip caching for API endpoints and admin routes
  else if (!path.startsWith('/api/') && !path.startsWith('/admin/')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
    )
  }

  return response
}
