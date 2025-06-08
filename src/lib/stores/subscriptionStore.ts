import { derived, writable } from 'svelte/store'
import { browser } from '$app/environment'
import type { User } from './user.store'

export type SubscriptionPlan = {
  id: string
  name: string
  board: string
  price: number
  originalPrice?: number
  duration: string
  description: string
  features: string[]
  popular?: boolean
}

export type UserSubscription = {
  id: string
  planId: string
  userId: string
  planName: string
  startDate: string
  endDate: string
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  autoRenew: boolean
  paymentStatus: 'paid' | 'pending' | 'failed'
  features: string[]
  board: string
}

type SubscriptionStore = {
  isLoading: boolean
  hasActiveSubscription: boolean
  availablePlans: SubscriptionPlan[]
  userSubscription: UserSubscription | null
  error: string | null
  lastUpdated: number | null
}

type CachedSubscriptionState = {
  state: Omit<SubscriptionStore, 'isLoading' | 'error'>
  timestamp: number
}

// Cache TTL in milliseconds (1 hour)
const CACHE_TTL = 60 * 60 * 1000

// Helper function to check if subscription is active
const isSubscriptionActive = (subscription: UserSubscription | null): boolean => {
  if (!subscription) return false
  if (subscription.status !== 'active') return false

  const now = new Date()
  const endDate = new Date(subscription.endDate)
  return endDate > now
}

// Helper to save state to localStorage
const saveToCache = (state: Omit<SubscriptionStore, 'isLoading' | 'error'>): void => {
  if (!browser) return

  const cache: CachedSubscriptionState = {
    state: {
      ...state,
      availablePlans: state.availablePlans,
    },
    timestamp: Date.now(),
  }

  try {
    localStorage.setItem('subscription_state', JSON.stringify(cache))
  } catch (error) {
    console.error('Failed to save subscription state to localStorage', error)
  }
}

// Helper to load state from localStorage
const loadFromCache = (): CachedSubscriptionState | null => {
  if (!browser) return null

  try {
    const cached = localStorage.getItem('subscription_state')
    if (!cached) return null

    const parsed = JSON.parse(cached) as CachedSubscriptionState

    // Check if cache is still valid
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem('subscription_state')
      return null
    }

    return parsed
  } catch (error) {
    console.error('Failed to load subscription state from localStorage', error)
    return null
  }
}

// Load initial state from cache if available
const cachedState = loadFromCache()
const initialState: SubscriptionStore = {
  isLoading: false,
  hasActiveSubscription: false,
  availablePlans: [],
  userSubscription: null,
  error: null,
  lastUpdated: cachedState?.timestamp || null,
}

// Create the store
const createSubscriptionStore = () => {
  const { subscribe, set, update } = writable<SubscriptionStore>({
    ...initialState,
    ...(cachedState?.state || {}),
  })

  // Update hasActiveSubscription whenever userSubscription changes
  const store = derived<typeof subscribe, Omit<SubscriptionStore, 'isLoading' | 'error'>>(
    subscribe,
    ($store) => {
      const { isLoading, error, ...rest } = $store
      return {
        ...rest,
        hasActiveSubscription: isSubscriptionActive(rest.userSubscription),
      }
    }
  )

  // Load subscription data from API
  const loadSubscription = async (user: User | null): Promise<void> => {
    if (!user?.id) {
      set({
        ...initialState,
        isLoading: false,
      })
      return
    }

    update((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }))

    try {
      // In a real app, you would fetch this from your API
      // const response = await fetch(`/api/users/${user.id}/subscription`);
      // const data = await response.json();

      // Mock response for now
      const data = {
        subscription: null as UserSubscription | null,
        plans: [],
      }

      const newState = {
        isLoading: false,
        hasActiveSubscription: isSubscriptionActive(data.subscription),
        availablePlans: data.plans,
        userSubscription: data.subscription,
        error: null,
        lastUpdated: Date.now(),
      }

      set(newState)
      saveToCache(newState)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load subscription'
      update((state) => ({
        ...state,
        isLoading: false,
        error: errorMessage,
      }))
    }
  }

  // Subscribe to a plan
  const subscribeToPlan = async (planId: string, paymentMethodId?: string): Promise<boolean> => {
    update((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }))

    try {
      // In a real app, you would call your API to create a subscription
      // const response = await fetch('/api/subscriptions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ planId, paymentMethodId }),
      // });
      // const data = await response.json();

      // Mock response for now
      const data = {
        subscription: {
          id: 'sub_' + Math.random().toString(36).substr(2, 9),
          planId,
          userId: 'user_' + Math.random().toString(36).substr(2, 9),
          planName: 'Premium',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          status: 'active',
          autoRenew: true,
          paymentStatus: 'paid',
          features: ['feature1', 'feature2'],
        } as UserSubscription,
      }

      const newState = {
        isLoading: false,
        hasActiveSubscription: true,
        availablePlans: [], // Will be updated on next load
        userSubscription: data.subscription,
        error: null,
        lastUpdated: Date.now(),
      }

      set(newState)
      saveToCache(newState)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe'
      update((state) => ({
        ...state,
        isLoading: false,
        error: errorMessage,
      }))
      return false
    }
  }

  // Cancel subscription
  const cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
    update((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }))

    try {
      // In a real app, you would call your API to cancel the subscription
      // await fetch(`/api/subscriptions/${subscriptionId}`, {
      //   method: 'DELETE',
      // });

      // Update local state
      update((state) => {
        if (!state.userSubscription) return state

        const newState = {
          ...state,
          isLoading: false,
          hasActiveSubscription: false,
          userSubscription: {
            ...state.userSubscription,
            status: 'cancelled',
            autoRenew: false,
            endDate: new Date().toISOString(),
          },
          lastUpdated: Date.now(),
        }

        saveToCache(newState)
        return newState
      })

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription'
      update((state) => ({
        ...state,
        isLoading: false,
        error: errorMessage,
      }))
      return false
    }
  }

  // Update payment method
  const updatePaymentMethod = async (
    subscriptionId: string,
    paymentMethodId: string
  ): Promise<boolean> => {
    update((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }))

    try {
      // In a real app, you would call your API to update the payment method
      // await fetch(`/api/subscriptions/${subscriptionId}/payment-method`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ paymentMethodId }),
      // });

      update((state) => ({
        ...state,
        isLoading: false,
        lastUpdated: Date.now(),
      }))

      return true
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update payment method'
      update((state) => ({
        ...state,
        isLoading: false,
        error: errorMessage,
      }))
      return false
    }
  }

  // Clear error
  const clearError = (): void => {
    update((state) => ({
      ...state,
      error: null,
    }))
  }

  // Reset store
  const reset = (): void => {
    set(initialState)
    if (browser) {
      localStorage.removeItem('subscription_state')
    }
  }

  return {
    subscribe: store.subscribe,
    loadSubscription,
    subscribeToPlan,
    cancelSubscription,
    updatePaymentMethod,
    clearError,
    reset,
  }
}

export const subscriptionStore = createSubscriptionStore()
