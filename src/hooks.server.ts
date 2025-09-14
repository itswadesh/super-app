/**
 * Server hooks for SvelteKit to add proper auth handling and caching headers
 * This ensures static assets are cached efficiently by Cloudflare
 */
import type { Handle } from '@sveltejs/kit'
import { dev } from '$app/environment'
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

  // Route protection: set redirect cookie if not authenticated and route is protected
  const pathname = event.url.pathname
  const isProtectedRoute =
    !pathname.startsWith('/api/') && pathname !== '/' && pathname !== '/foods'
  const isAuthenticated = event.locals.user && event.locals.session

  if (isProtectedRoute && !isAuthenticated) {
    // Set a cookie with the intended URL for redirect after login
    event.cookies.set('auth_redirect_url', pathname, {
      path: '/',
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 60 * 5, // 5 minutes
    })
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
    if (dev) {
      // Disable caching in development mode
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    } else {
      // Set a long cache time for static assets (1 year) in production
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    }
  }
  // For HTML and other dynamic content, use a shorter cache with validation
  // Skip caching for API endpoints and admin routes
  else if (!path.startsWith('/api/') && !path.startsWith('/admin')) {
    if (dev) {
      // Disable caching in development mode
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    } else {
      // Use caching in production
      response.headers.set(
        'Cache-Control',
        'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
      )
    }
  }

  return response
}
