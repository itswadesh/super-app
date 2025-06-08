<script lang="ts">
// Using Svelte 5 runes syntax
const props = $props<{
  couponCode: string
  validatingCoupon: boolean
  couponError: string
  couponDiscount: number
  selectedPlan: any
}>()

let localCouponCode = $state(props.couponCode || '')

const dispatch = createEventDispatcher<{
  close: void
  apply: { couponCode: string }
  remove: void
}>()

import { currency } from '$lib/utils'
import { createEventDispatcher } from 'svelte'
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in">
        <!-- Close button -->
        <button 
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            onclick={() => dispatch('close')}
            aria-label="Close dialog"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
        </button>

        <h3 class="text-xl font-semibold text-gray-900 mb-4">Apply Coupon</h3>
        
        <div class="space-y-4">
            <div class="relative">
                <input 
                    type="text" 
                    bind:value={localCouponCode}
                    placeholder="Enter coupon code"
                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    disabled={props.validatingCoupon}
                />
                
                <button 
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-primary-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 hover:bg-primary-50 rounded-full transition-colors"
                    disabled={!localCouponCode || props.validatingCoupon}
                    onclick={() => dispatch('apply', { couponCode: localCouponCode })}
                >
                    {#if props.validatingCoupon}
                        <div class="flex items-center gap-1">
                            <div class="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                            <span>Validating</span>
                        </div>
                    {:else}
                        Apply
                    {/if}
                </button>
            </div>

            {#if props.couponError}
                <p class="text-red-500 text-sm">{props.couponError}</p>
            {/if}

            {#if props.couponDiscount > 0 && props.selectedPlan}
                <div class="p-4 bg-green-50 rounded-lg">
                    <div class="flex justify-between items-center text-green-800">
                        <span class="font-medium">Discount</span>
                        <span>-₹{currency(props.couponDiscount, "", 2)}</span>
                    </div>
                    <div class="flex justify-between items-center mt-2 font-bold">
                        <span>You Pay</span>
                        <span>₹{currency(props.selectedPlan.price - props.couponDiscount, "", 2)}</span>
                    </div>
                    <div class="mt-3 text-xs text-green-700 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Coupon applied successfully!</span>
                    </div>
                </div>
            {/if}

            <div class="flex gap-3 mt-6">
                {#if props.couponDiscount > 0}
                    <button 
                        class="flex-1 py-2 px-4 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors"
                        onclick={() => dispatch('remove')}
                    >
                        Remove Coupon
                    </button>
                {/if}
                <button 
                    class="flex-1 py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
                    onclick={() => dispatch('close')}
                >
                    {props.couponDiscount > 0 ? 'Confirm' : 'Skip'}
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
</style>
