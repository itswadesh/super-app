<script lang="ts">
import { goto } from '$app/navigation'
import { subscriptionStore } from '$lib/stores/subscriptionStore'
import { onMount } from 'svelte'

// Define subscription interface
interface UserSubscription {
  id: string
  userId: string
  planId: string
  amount: number
  startDate: string
  endDate: string
  status: string
}

// Subscription data using Svelte 5 runes
let subscriptionDetails = $state<UserSubscription | null>(null)
let loading = $state(true)
let error = $state('')

onMount(async () => {
  try {
    // Get the parameters from URL
    const urlParams = new URLSearchParams(window.location.search)
    const subscriptionId = urlParams.get('id')

    await subscriptionStore.checkSubscription()

    // Get the subscription from the store
    let userSubscription: UserSubscription | null = null
    const unsubscribe = subscriptionStore.subscribe((state) => {
      userSubscription = state.userSubscription as UserSubscription | null
    })
    unsubscribe()

    if (userSubscription) {
      subscriptionDetails = userSubscription
    } else {
      error = 'Subscription details not found'
    }
  } catch (err: any) {
    console.error('Error loading subscription details:', err)
    error = 'Failed to load subscription details: ' + (err.message || '')
  } finally {
    loading = false
  }
})

// Format a date string
function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Go to homepage
function goToHomepage(): void {
  goto('/')
}

// Go to profile
function goToProfile(): void {
  goto('/profile')
}
</script>

<svelte:head>
  <title>Subscription Success - Super App | Knowledge Amplified</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="flex justify-center">
      <a href="/" class="flex items-center">
        <span class="text-3xl font-bold text-indigo-700">Super App</span>
        <span class="ml-1 text-xl font-light text-gray-500">| Knowledge Amplified</span>
      </a>
    </div>
    
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      Subscription Activated
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600">
      Your premium content access has been successfully set up
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {#if loading}
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-600">Loading subscription details...</p>
        </div>
      {:else if error}
        <div class="text-center py-8">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p class="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onclick={goToHomepage}
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
          >
            Return to Homepage
          </button>
        </div>
      {:else if subscriptionDetails}
        <!-- Success Content -->
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg class="h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 class="text-lg font-medium text-gray-900 mb-2">Your premium access is active!</h3>
          <p class="text-sm text-gray-600 mb-6">
            You now have full access to all premium content for.
          </p>
          
          <!-- Subscription Details Card -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6 text-left border border-gray-200">
            <h4 class="font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">Subscription Details</h4>
            
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-gray-500">Plan:</p>
                <p class="font-medium text-gray-800">
                  {subscriptionDetails.planId === 'annual' ? 'Annual Premium' : subscriptionDetails.planId}
                </p>
              </div>
              
              <div>
                <p class="text-gray-500">Status:</p>
                <p class="font-medium">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </p>
              </div>
              
              <div>
                <p class="text-gray-500">Start Date:</p>
                <p class="font-medium text-gray-800">{formatDate(subscriptionDetails.startDate)}</p>
              </div>
              
              <div>
                <p class="text-gray-500">Expiry:</p>
                <p class="font-medium text-gray-800">{formatDate(subscriptionDetails.endDate)}</p>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex space-x-3">
            <button
              onclick={goToProfile}
              class="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
              <svg class="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              View Profile
            </button>
            
            <button
              onclick={goToHomepage}
              class="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
              <svg class="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Go to Homepage
            </button>
          </div>
        </div>
      {:else}
        <div class="text-center py-8">
          <p class="text-gray-600">No subscription information found.</p>
          <button
            onclick={goToHomepage}
            class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
          >
            Return to Homepage
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
