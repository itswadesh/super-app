import type { SubscriptionPlan } from '$lib/stores/subscriptionStore'

// Format price with currency
export const formatPrice = (price: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

// Get duration text
export const getDurationText = (duration: string): string => {
  if (duration.includes('month')) return 'Per Month'
  if (duration.includes('year') || duration.includes('annual')) return 'Per Year'
  return ''
}

// Calculate remaining days
export const getRemainingDays = (endDate: string | Date): number => {
  const end = new Date(endDate)
  const today = new Date()
  const diffTime = end.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

// Categorize plans by duration
export const categorizePlans = (plans: SubscriptionPlan[]) => {
  return {
    monthly: plans.filter((p) => p.duration.includes('month')),
    yearly: plans.filter((p) => p.duration.includes('year') || p.duration.includes('annual')),
  }
}

// Format date
export const formatDate = (dateString: string | Date): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
