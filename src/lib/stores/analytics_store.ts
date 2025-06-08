import { events, initializeAnalytics, trackPageView } from '$lib/analytics/google_analytics'
import { onMount } from 'svelte'
import { writable } from 'svelte/store'

// Create a proper Svelte store instead of using runes
const analyticsState = writable({
  initialized: false,
})

// Initialize analytics
export function useAnalytics() {
  // Initialize with default state to avoid TypeScript errors
  let state = { initialized: false }

  // Set up unsubscribe function to avoid memory leaks
  const unsubscribe = analyticsState.subscribe((value) => {
    state = value
  })

  if (!state.initialized) {
    onMount(() => {
      // Initialize Google Analytics
      initializeAnalytics()

      // Track initial page view
      trackPageView(window.location.pathname)

      analyticsState.update((state) => ({ ...state, initialized: true }))
    })
  }

  // Return analytics functions for use in components
  return {
    events,
    trackPageView,
  }
}
