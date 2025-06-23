<script lang="ts">
import SubscriptionPlanCard from './SubscriptionPlanCard.svelte'
import type { SubscriptionPlan } from '$lib/stores/subscriptionStore'

// Props
export let plans: SubscriptionPlan[] = []
export let selectedPlan: SubscriptionPlan | null = null
export let onSelectPlan: (plan: SubscriptionPlan) => void
export let isLoading: boolean = false
export let error: string | null = null

// Find the most popular plan (for highlighting)
const popularPlan = $derived(
  plans.length > 0
    ? plans.reduce((prev, current) =>
        prev.popular || (prev.isPopular && !current.popular && !current.isPopular) ? prev : current
      )
    : null
)
</script>

<div class="container mx-auto">
  {#if isLoading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  {:else if plans.length === 0}
    <div class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">No plans available</h3>
      <p class="mt-1 text-sm text-gray-500">There are no subscription plans available at the moment.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {#each plans as plan}
        <div class="relative">
          <SubscriptionPlanCard
            {plan}
            isSelected={selectedPlan?.id === plan.id}
            isPopular={plan.id === popularPlan?.id}
            onSelect={() => onSelectPlan(plan)}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>
