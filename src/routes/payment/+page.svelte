<script lang="ts">
import { goto } from '$app/navigation'
import { subscriptionStore } from '$lib/stores/subscriptionStore'
import { onMount } from 'svelte'

let isProcessing = $state(false)
let paymentMethod = $state('upi')
let upiId = $state('')
let cardNumber = $state('')
let expiryDate = $state('')
let cvv = $state('')
let cardholderName = $state('')
let isPaymentComplete = $state(false)
let errorMessage = $state('')

// Get board and price from URL parameters
onMount(() => {
  // Redirect if no board or price is provided
  // if (!board || !price) {
  //   goto('/');
  // }
})

// Format card number with spaces
function formatCardNumber(e: Event) {
  const input = e.target as HTMLInputElement
  let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')

  if (value.length > 16) {
    value = value.slice(0, 16)
  }

  // Format with spaces after every 4 digits
  const formattedValue = value.replace(/(.{4})/g, '$1 ').trim()
  cardNumber = formattedValue
}

// Format expiry date (MM/YY)
function formatExpiryDate(e: Event) {
  const input = e.target as HTMLInputElement
  let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')

  if (value.length > 4) {
    value = value.slice(0, 4)
  }

  if (value.length > 2) {
    expiryDate = value.slice(0, 2) + '/' + value.slice(2)
  } else {
    expiryDate = value
  }
}

// Validate UPI ID
function validateUpiId() {
  const upiRegex = /^[\w.-]+@[\w.-]+$/
  return upiRegex.test(upiId)
}

// Validate credit card details
function validateCardDetails() {
  // Basic validations
  if (cardNumber.replace(/\s+/g, '').length !== 16) return false
  if (expiryDate.length !== 5) return false
  if (cvv.length !== 3) return false
  if (!cardholderName.trim()) return false

  return true
}

// Process payment
async function processPayment() {
  errorMessage = ''

  // Validate payment method details
  if (paymentMethod === 'upi' && !validateUpiId()) {
    errorMessage = 'Please enter a valid UPI ID'
    return
  }

  if (paymentMethod === 'card' && !validateCardDetails()) {
    errorMessage = 'Please fill in all card details correctly'
    return
  }

  isProcessing = true

  try {
    // In a real app, this would be an API call to process payment
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Now create the subscription in the database
    const priceNumber = Number.parseInt(price) || 999 // Default price if parsing fails
    const subscription = await subscriptionStore.createSubscription(
      'annual', // Using annual plan by default
      priceNumber
    )

    if (!subscription) {
      throw new Error('Failed to create subscription. Please try again.')
    }

    // Payment and subscription creation successful
    isPaymentComplete = true

    // After a short delay, redirect to success page
    setTimeout(() => {
      goto('/payment/success')
    }, 1500)
  } catch (err: any) {
    console.error('Payment processing error:', err)
    errorMessage = err.message || 'Payment processing failed. Please try again.'
  } finally {
    isProcessing = false
  }
}

// Return to homepage
function goToHomepage() {
  goto('/')
}
</script>

<svelte:head>
  <title>Payment - Super App | Knowledge Amplified</title>
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
      {isPaymentComplete ? 'Payment Successful!' : 'Complete Your Purchase'}
    </h2>
    <div class="mt-2 text-center text-sm text-gray-600">
      <span class="font-medium text-indigo-600">Premium Learning Subscription</span>
    </div>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {#if isPaymentComplete}
        <!-- Payment Success Screen -->
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg class="h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 class="text-lg font-medium text-gray-900 mb-2">Subscription Activated!</h3>
          <p class="text-sm text-gray-600 mb-6">
            Your subscription to materials has been successfully activated.
            You now have full access to all premium content for one year.
          </p>
          
          <div class="mt-6">
            <button
              type="button"
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              onclick={goToHomepage}
            >
              Return to Homepage
            </button>
          </div>
        </div>
      {:else}
        <!-- Subscription Benefits -->
        <div class="rounded-md bg-indigo-50 p-4 mb-6 border border-indigo-100">
          <h3 class="text-lg font-medium text-indigo-900 mb-3">Subscription Benefits</h3>
          <ul class="space-y-2">
            <li class="flex items-start">
              <svg class="h-5 w-5 text-indigo-600 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>1 Year Doubt Clearance Support</strong> - Get unlimited access to expert guidance for all your doubts!</span>
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-indigo-600 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Complete Access</strong> - All Quizzes, Notes and Videos under ₹1 per day!</span>
            </li>
            <li class="flex items-start">
              <svg class="h-5 w-5 text-indigo-600 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Premium Content</strong> - Access to exclusive study materials and practice tests</span>
            </li>
          </ul>
        </div>
        
        <!-- Order Summary -->
        <div class="rounded-md bg-gray-50 p-4 mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-3">Order Summary</h3>
          <div class="flex justify-between mb-2">
            <span class="text-sm text-gray-700">Materials</span>
            <span class="text-sm font-medium text-gray-900">u20b9{price}/year</span>
          </div>
          <div class="border-t border-gray-200 pt-2 mt-2">
            <div class="flex justify-between">
              <span class="text-base font-medium text-gray-900">Total</span>
              <span class="text-base font-medium text-gray-900">u20b9{price}</span>
            </div>
          </div>
        </div>
        
        <!-- Payment Method Selection -->
        <div class="mb-6">
          <fieldset id="payment-method-group">
            <legend class="text-base font-medium text-gray-900">Payment Method</legend>
            <div class="mt-3 space-y-3">
              <div class="flex items-center">
              <input 
                id="payment-upi"
                name="payment-method" 
                type="radio" 
                checked={paymentMethod === 'upi'}
                onchange={() => paymentMethod = 'upi'}
                class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              />
              <label for="payment-upi" class="ml-3 block text-sm font-medium text-gray-700">UPI</label>
            </div>
              <div class="flex items-center">
              <input 
                id="payment-card"
                name="payment-method" 
                type="radio" 
                checked={paymentMethod === 'card'}
                onchange={() => paymentMethod = 'card'}
                class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              />
              <label for="payment-card" class="ml-3 block text-sm font-medium text-gray-700">Credit/Debit Card</label>
            </div>
          </div>
        </div>
        
        <!-- UPI Payment Form -->
        {#if paymentMethod === 'upi'}
          <div>
            <label for="upi-id" class="block text-sm font-medium text-gray-700">UPI ID</label>
            <div class="mt-1">
              <input
                type="text"
                id="upi-id"
                placeholder="yourname@upi"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                bind:value={upiId}
              />
            </div>
          </div>
        {/if}
        
        <!-- Credit Card Payment Form -->
        {#if paymentMethod === 'card'}
          <div class="space-y-4">
            <div>
              <label for="card-number" class="block text-sm font-medium text-gray-700">Card Number</label>
              <div class="mt-1">
                <input
                  type="text"
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={cardNumber}
                  oninput={formatCardNumber}
                  maxlength="19"
                />
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="expiry" class="block text-sm font-medium text-gray-700">Expiry Date</label>
                <div class="mt-1">
                  <input
                    type="text"
                    id="expiry"
                    placeholder="MM/YY"
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={expiryDate}
                    oninput={formatExpiryDate}
                    maxlength="5"
                  />
                </div>
              </div>
              
              <div>
                <label for="cvv" class="block text-sm font-medium text-gray-700">CVV</label>
                <div class="mt-1">
                  <input
                    type="password"
                    id="cvv"
                    placeholder="123"
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    bind:value={cvv}
                    maxlength="3"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Cardholder Name</label>
              <div class="mt-1">
                <input
                  type="text"
                  id="name"
                  placeholder="Jane Doe"
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  bind:value={cardholderName}
                />
              </div>
            </div>
          </div>
        {/if}
        
        {#if errorMessage}
          <div class="mt-4">
            <p class="text-sm text-red-600">{errorMessage}</p>
          </div>
        {/if}
        
        <div class="mt-6">
          <button
            type="button"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 cursor-pointer"
            disabled={isProcessing}
            onclick={processPayment}
          >
            {#if isProcessing}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            {:else}
              Pay u20b9{price}
            {/if}
          </button>
        </div>
        
        <div class="mt-6 text-center">
          <p class="text-xs text-gray-500">
            <span class="block mb-1">This is a demo. No actual payment will be processed.</span>
            Clicking "Pay" will simulate a successful payment.
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
