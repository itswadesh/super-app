<script lang="ts">
import type { SubscriptionPlan } from '$lib/stores/subscriptionStore'

// Props
export let plan: SubscriptionPlan
export let isSelected: boolean = false
export let onSelect: () => void
export let isPopular: boolean = false

// Format price with currency
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

// Get duration text
const getDurationText = (duration: string) => {
  if (duration.includes('month')) return 'Per Month'
  if (duration.includes('year') || duration.includes('annual')) return 'Per Year'
  return ''
}
</script>

<div 
  class="relative flex flex-col text-left rounded-2xl border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-shadow p-6 group cursor-pointer {isSelected ? 'ring-2 ring-primary-500' : ''}" 
  on:click={onSelect}
>
  {#if isPopular}
    <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
      Most Popular
    </div>
  {/if}
  
  <div class="flex-1">
    <h3 class="text-xl font-bold text-gray-900">{plan.name}</h3>
    
    <div class="mt-4">
      <p class="text-4xl font-extrabold text-gray-900">
        {formatPrice(plan.price)}
        <span class="text-base font-normal text-gray-500">/{getDurationText(plan.duration)}</span>
      </p>
      
      {plan.original_price && plan.original_price > plan.price && (
        <p class="text-sm text-gray-500 line-through">
          {formatPrice(plan.original_price)}
        </p>
      )}
    </div>
    
    <ul class="mt-6 space-y-3">
      {#each plan.features as feature}
        <li class="flex items-start">
          <svg class="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="text-gray-600">{feature}</span>
        </li>
      {/each}
    </ul>
  </div>
  
  <div class="mt-8">
    <button
      class={`w-full px-4 py-2 rounded-md font-medium ${isSelected ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
    >
      {isSelected ? 'Selected' : 'Select Plan'}
    </button>
  </div>
</div>
