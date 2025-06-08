<script lang="ts">
import type { PlanType } from '$lib/config/plans'
import { currency } from '$lib/utils'

// Using Svelte 5 runes
const props = $props<{
  selectedPlan: PlanType | null
  couponCode: string
  couponDiscount: number
  validatingCoupon: boolean
  couponError: string
  // Define event handler props using Svelte 5 syntax
  onclose?: () => void
  onvalidate?: () => void
  onproceed?: () => void
  onremove?: () => void
}>()

function closeDialog() {
  if (props.onclose) props.onclose()
}

function validateCoupon() {
  if (props.onvalidate) props.onvalidate()
}

function proceedToPay() {
  if (props.onproceed) {
    props.onproceed()
  }
}

function removeCoupon() {
  if (props.onremove) props.onremove()
}

// Close on escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeDialog()
  }
}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal backdrop -->
<div
    class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
    onclick={closeDialog}
    onkeydown={(e) => e.key === "Escape" && closeDialog()}
    role="dialog"
    aria-modal="true"
    tabindex="0"
>
    <!-- Modal content -->
    <div
        class="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        aria-labelledby="order-summary-title"
    >
        <!-- Modal header -->
        <div
            class="border-b border-gray-100 px-6 py-4 flex items-center justify-between"
        >
            <h3
                id="order-summary-title"
                class="text-xl font-bold text-gray-800"
            >
                Order Summary
            </h3>
            <button
                class="text-gray-400 hover:text-gray-600"
                onclick={closeDialog}
                aria-label="Close dialog"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>

        <!-- Modal body -->
        <div class="p-6">
            {#if props.selectedPlan}
                <div class="space-y-5">
                    <!-- Plan details -->
                    <div
                        class="flex items-center justify-between pb-4 border-b border-gray-100"
                    >
                        <div class="flex flex-col">
                            <span class="text-lg font-medium text-gray-800"
                                >{props.selectedPlan.name}</span
                            >
                            <span class="text-sm text-gray-500"
                                >1 year subscription</span
                            >
                        </div>
                        <span class="text-lg font-semibold"
                            >₹{props.selectedPlan.price}</span
                        >
                    </div>

                    <!-- Price breakdown -->
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">Subtotal</span>
                            <span class="font-medium"
                                >₹{props.selectedPlan.price}</span
                            >
                        </div>

                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">Discount</span>
                            <span class="font-medium text-green-600">
                                {props.couponDiscount > 0
                                    ? `-₹${currency(props.couponDiscount, "", 2)}`
                                    : "₹0"}
                            </span>
                        </div>

                        <div
                            class="flex justify-between items-center pt-3 border-t border-gray-100"
                        >
                            <span class="font-medium">Total to Pay</span>
                            <span
                                class="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-orange-500"
                            >
                                ₹{currency(
                                    props.selectedPlan.price -
                                        props.couponDiscount,
                                    "",
                                    2,
                                )}
                            </span>
                        </div>
                    </div>

                    <!-- Coupon code input -->
                    <div class="space-y-3 mt-5">
                        <div class="relative">
                            <input
                                type="text"
                                bind:value={props.couponCode}
                                placeholder="Have a coupon?"
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                disabled={props.validatingCoupon}
                            />
                            <button
                                class="absolute right-2 top-1/2 -translate-y-1/2 text-primary-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 hover:bg-primary-50 rounded-full transition-colors"
                                disabled={!props.couponCode ||
                                    props.validatingCoupon}
                                onclick={validateCoupon}
                            >
                                {#if props.validatingCoupon}
                                    <div class="flex items-center gap-1">
                                        <div
                                            class="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
                                        ></div>
                                        <span>Checking</span>
                                    </div>
                                {:else if props.couponDiscount > 0}
                                    <div
                                        class="flex items-center gap-1 text-red-500"
                                        onclick={removeCoupon}
                                        onkeydown={(e) =>
                                            e.key === "Enter" && removeCoupon()}
                                        role="button"
                                        tabindex="0"
                                    >
                                        <span>Remove</span>
                                    </div>
                                {:else}
                                    Apply
                                {/if}
                            </button>
                        </div>

                        {#if props.couponError}
                            <p class="text-red-500 text-sm">
                                {props.couponError}
                            </p>
                        {/if}
                    </div>

                    <!-- Action buttons -->
                    <button
                        onclick={proceedToPay}
                        class="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:opacity-90 text-white font-medium py-3 px-6 rounded-md transition-colors shadow-md flex items-center justify-center gap-2 mt-4"
                        disabled={props.validatingCoupon}
                    >
                        <span>Proceed to Pay</span>
                        <span class="font-bold"
                            >₹{currency(
                                props.selectedPlan.price - props.couponDiscount,
                                "",
                                2,
                            )}</span
                        >
                        <span class="text-xs font-normal">/year</span>
                    </button>

                    <div class="text-xs text-center text-gray-500 mt-2">
                        Secure payment powered by PhonePe • One-time payment •
                        Auto-renewal optional
                    </div>
                </div>
            {:else}
                <div class="py-8 text-center text-gray-500">
                    No plan selected. Please select a subscription plan first.
                </div>
            {/if}
        </div>
    </div>
</div>
