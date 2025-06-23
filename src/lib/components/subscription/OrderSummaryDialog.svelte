<script lang="ts">
import { createEventDispatcher } from 'svelte'
import type { SubscriptionPlan } from '$lib/stores/subscriptionStore'

// Props
export let open: boolean = false
export let plan: SubscriptionPlan
export let couponCode: string = ''
export let couponDiscount: number = 0
export let applyingCoupon: boolean = false
export let couponError: string = ''

// Events
const dispatch = createEventDispatcher<{
  close: void
  confirm: { plan: SubscriptionPlan; couponCode: string }
  applyCoupon: { code: string }
  removeCoupon: void
}>()

// Calculate total
const subtotal = $derived(plan.price)
const discount = $derived(couponDiscount)
const total = $derived(subtotal - discount)

// Format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

// Handle form submission
function handleSubmit() {
  dispatch('confirm', { plan, couponCode })
}

// Handle coupon application
function handleApplyCoupon(code: string) {
  dispatch('applyCoupon', { code })
}

// Handle coupon removal
function handleRemoveCoupon() {
  dispatch('removeCoupon')
}

// Close the dialog
function closeDialog() {
  dispatch('close')
}
</script>

{#if open}
  <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
    <div class="flex min-h-screen items-center justify-center p-4 text-center sm:block sm:p-0">
      <!-- Overlay -->
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        on:click={closeDialog}
        aria-hidden="true"
      ></div>

      <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

      <!-- Dialog panel -->
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <div class="absolute top-0 right-0 pt-4 pr-4">
          <button 
            type="button" 
            class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            on:click={closeDialog}
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <div class="text-center sm:mt-0 sm:text-left">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              Order Summary
            </h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500">
                Review your subscription details before proceeding to payment.
              </p>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-medium text-gray-900">{plan.name} Plan</h4>
            <p class="mt-1 text-sm text-gray-600">
              {plan.duration.includes('month') ? 'Monthly' : 'Annual'} subscription
            </p>
          </div>

          <!-- Price breakdown -->
          <div class="mt-6 border-t border-gray-200 pt-6">
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Subtotal</span>
                <span class="text-sm font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              
              {couponCode && (
                <div class="flex justify-between">
                  <div class="flex items-center">
                    <span class="text-sm text-gray-600">Coupon: {couponCode}</span>
                    <button 
                      type="button"
                      class="ml-2 text-sm text-red-600 hover:text-red-800"
                      on:click={handleRemoveCoupon}
                      disabled={applyingCoupon}
                    >
                      Remove
                    </button>
                  </div>
                  <span class="text-sm font-medium text-green-600">-{formatPrice(discount)}</span>
                </div>
              )}
              
              <div class="flex justify-between border-t border-gray-200 pt-3">
                <span class="text-base font-medium text-gray-900">Total</span>
                <span class="text-base font-bold text-gray-900">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <!-- Coupon form -->
          {!couponCode && (
            <div class="mt-6">
              <label for="coupon" class="block text-sm font-medium text-gray-700">Coupon code</label>
              <div class="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="coupon"
                  bind:value={couponCode}
                  class="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border-gray-300"
                  placeholder="Enter coupon code"
                />
                <button
                  type="button"
                  class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  on:click={() => handleApplyCoupon(couponCode)}
                  disabled={applyingCoupon || !couponCode.trim()}
                >
                  {applyingCoupon ? 'Applying...' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <p class="mt-2 text-sm text-red-600">{couponError}</p>
              )}
            </div>
          )}
        </div>

        <div class="mt-6 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm"
            on:click={handleSubmit}
          >
            Confirm & Pay
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            on:click={closeDialog}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
