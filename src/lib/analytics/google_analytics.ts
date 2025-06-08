// Google Analytics integration

// Define types for GA4 event tracking
type EventParams = Record<string, string | number | boolean>

// Add gtag to window object
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, eventParams?: Record<string, unknown>) => void;
    dataLayer: unknown[]
  }
}

// Configuration
const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID || ''

// Initialize Analytics
export function initializeAnalytics(): void {
  if (typeof window !== 'undefined') {
    // Create script elements and add to document
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`

    const script2 = document.createElement('script')
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', { 'send_page_view': true });
    `

    // Add scripts to document head
    document.head.appendChild(script1)
    document.head.appendChild(script2)
  }
}

// Track page views
export function trackPageView(path: string, title?: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    })
  }
}

// Track events
export function trackEvent(eventName: string, eventParams: EventParams = {}): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams)
  }
}

// Common events for learning platform
export const events = {
  // User engagement events
  login: (method: string) => trackEvent('login', { method }),
  signup: (method: string) => trackEvent('sign_up', { method }),
  profileUpdate: () => trackEvent('profile_update'),

  // Content interaction events
  videoPlay: (videoId: string, videoTitle: string) =>
    trackEvent('video_play', { video_id: videoId, video_title: videoTitle }),
  videoComplete: (videoId: string, videoTitle: string) =>
    trackEvent('video_complete', { video_id: videoId, video_title: videoTitle }),
  noteView: (noteId: string, noteTitle: string) => trackEvent('note_view', { note_id: noteId, note_title: noteTitle }),
  quizStart: (quizId: string, quizTitle: string) =>
    trackEvent('quiz_start', { quiz_id: quizId, quiz_title: quizTitle }),
  quizComplete: (quizId: string, score: number) => trackEvent('quiz_complete', { quiz_id: quizId, score }),

  // Navigation events
  categorySelect: (categoryId: string, categoryName: string) =>
    trackEvent('category_select', { category_id: categoryId, category_name: categoryName }),
  search: (searchTerm: string, resultCount: number) =>
    trackEvent('search', { search_term: searchTerm, result_count: resultCount }),

  // Conversion events
  subscriptionView: (planId: string, planName: string) =>
    trackEvent('subscription_view', { plan_id: planId, plan_name: planName }),
  subscriptionStart: (planId: string, planName: string, price: number) =>
    trackEvent('begin_checkout', { plan_id: planId, plan_name: planName, price }),
  subscriptionComplete: (planId: string, planName: string, price: number) =>
    trackEvent('purchase', { plan_id: planId, plan_name: planName, price }),
}
