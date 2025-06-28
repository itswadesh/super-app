<script lang="ts">
import { goto } from '$app/navigation'
import { authService } from '$lib/services/auth-service'
import { onMount } from 'svelte'
import { Button } from '$lib/components/ui/button'
import { Input } from '$lib/components/ui/input'

let phoneNumber = $state('')
let isValidPhoneNumber = $state(false)
let showOtpVerification = $state(false)
let otp = $state(['', '', '', ''])
let otpError = $state('')
let isLoading = $state(false)
let redirectUrl = $state('/')
let purchaseInfo = $state(null)

// Check for redirect URL and purchase info from query parameters
onMount(() => {
  const urlParams = new URLSearchParams(window.location.search)

  // Get purchase info if it exists
  const board = urlParams.get('board')
  const price = urlParams.get('price')

  // Store the return to purchase page URL with all parameters
  const returnToPurchase = urlParams.get('returnToPurchase')
  const redirect = urlParams.get('redirect')

  if (returnToPurchase) {
    // If we have a specific return URL, prioritize it
    redirectUrl = returnToPurchase || '/'
  } else if (redirect) {
    // Otherwise use the general redirect parameter
    redirectUrl = redirect
  }

  if (board && price) {
    purchaseInfo = { board, price }

    // If we have purchase info but no specific return URL,
    // make sure we'll go back to payment page
    if (!returnToPurchase) {
      redirectUrl = `/payment?board=${board}&price=${price}`
    }
  }
})

// Validate phone number (10 digits)
function validatePhoneNumber() {
  const phoneRegex = /^[6-9]\d{9}$/ // Indian mobile numbers typically start with 6, 7, 8, or 9
  isValidPhoneNumber = phoneRegex.test(phoneNumber)
  return isValidPhoneNumber
}

// Send OTP to user's phone
async function sendOTP() {
  if (!validatePhoneNumber()) return

  isLoading = true

  try {
    // In a real application, you would call an API to send OTP
    // For demo purposes, we're simulating an API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Show OTP verification form
    showOtpVerification = true
    isLoading = false
  } catch (error) {
    console.error('Error sending OTP:', error)
    isLoading = false
  }
}

// Handle OTP input changes and auto-focus next input
function handleOtpChange(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value

  // Only allow single digit
  if (/^\d$/.test(value)) {
    otp[index] = value

    // Focus next input if available
    if (index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  } else {
    // Clear if not a digit
    otp[index] = ''
  }

  otpError = ''
}

// Handle backspace in OTP input
function handleKeyDown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace') {
    if (otp[index] === '' && index > 0) {
      // Move focus to previous input if current is empty
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) {
        prevInput.focus()
        // Clear the previous input
        otp[index - 1] = ''
      }
    } else {
      // Clear current input
      otp[index] = ''
    }
  }
}

// Verify entered OTP
async function verifyOTP() {
  // Check if all OTP digits are provided
  if (otp.some((digit) => digit === '')) {
    otpError = 'Please enter the complete 4-digit OTP'
    return
  }

  isLoading = true

  try {
    // For demo purposes, we're considering 1234 as the valid OTP
    // In a real app, you would validate this against an API
    const enteredOtp = otp.join('')
    // Use auth service to verify OTP
    const result = await authService.verifyOtp(phoneNumber, enteredOtp)

    if (result.success) {
      // OTP validation successful - redirect user
      // We've already set the redirectUrl appropriately in onMount based on
      // whether this was a purchase flow or regular login
      goto(redirectUrl)
    } else {
      otpError = result.message
    }

    isLoading = false
  } catch (error) {
    console.error('Error verifying OTP:', error)
    otpError = 'Failed to verify OTP. Please try again.'
    isLoading = false
  }
}

// Resend OTP
async function resendOTP() {
  isLoading = true
  otpError = ''

  try {
    // In a real app, you would call an API to resend the OTP
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Reset OTP fields
    otp = ['', '', '', '']

    isLoading = false
  } catch (error) {
    console.error('Error resending OTP:', error)
    isLoading = false
  }
}
</script>

<svelte:head>
  <title>Login - Super App | HAL</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="flex justify-center">
      <a href="/" class="flex items-center">
        <span class="text-3xl font-bold text-indigo-700">Super App</span>
        <span class="ml-1 text-xl font-light text-gray-500">| HAL</span>
      </a>
    </div>
    
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      {#if purchaseInfo}
        Subscribe to {purchaseInfo.board} Materials
      {:else if showOtpVerification}
        Verify OTP
      {:else}
        Login to your account
      {/if}
    </h2>
    
    {#if purchaseInfo}
      <p class="mt-2 text-center text-md text-gray-600">
        Complete verification to purchase {purchaseInfo.board} materials for ₹{purchaseInfo.price}
      </p>
    {/if}
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {#if !showOtpVerification}
        <!-- Phone Number Input Form -->
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700">Mobile Number</label>
          <div class="mt-1 relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span class="text-gray-500 sm:text-sm">+91</span>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span class="text-gray-500 text-sm">+91</span>
              </div>
              <Input
                type="tel"
                id="phone"
                class="pl-12 w-full"
                placeholder="10-digit mobile number"
                maxlength="{10}"
                bind:value={phoneNumber}
                oninput={validatePhoneNumber}
              />
            </div>
          </div>
          {#if phoneNumber && !isValidPhoneNumber}
            <p class="mt-2 text-sm text-red-600">Please enter a valid 10-digit mobile number</p>
          {/if}
        </div>

        <div class="mt-6">
          <Button
            type="button"
            class="w-full py-6"
            disabled={!isValidPhoneNumber || isLoading}
            onclick={sendOTP}
          >
            {#if isLoading}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending OTP...
            {:else}
              Continue with OTP
            {/if}
          </Button>
        </div>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Using Super App for the first time?</span>
            </div>
          </div>

          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Don't worry, we'll create an account for you automatically.
            </p>
          </div>
        </div>
      {:else}
        <!-- OTP Verification Form -->
        <div>
          <p class="text-sm text-gray-600 mb-4">
            We've sent a 4-digit OTP to your phone number
            <span class="font-semibold">+91 {phoneNumber}</span>
          </p>
          
          <label for="otp-0" class="block text-sm font-medium text-gray-700">Enter 4-digit OTP</label>
          <div class="mt-1 flex justify-center space-x-3">
            {#each Array(4) as _, i}
              <input
                id={`otp-${i}`}
                type="text"
                maxlength="1"
                class="block w-12 h-12 text-center text-xl focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                value={otp[i]}
                oninput={(e) => handleOtpChange(i, e)}
                onkeydown={(e) => handleKeyDown(i, e)}
              />
            {/each}
          </div>
          {#if otpError}
            <p class="mt-2 text-sm text-red-600">{otpError}</p>
          {/if}
          
          <div class="flex items-center justify-between mt-6">
            <button
              type="button"
              class="text-sm text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline disabled:text-gray-400"
              disabled={isLoading}
              onclick={() => (showOtpVerification = false)}
            >
              Change Number
            </button>
            <button
              type="button"
              class="text-sm text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline disabled:text-gray-400"
              disabled={isLoading}
              onclick={resendOTP}
            >
              Resend OTP
            </button>
          </div>

          <div class="mt-6">
            <button
              type="button"
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              disabled={otp.some(digit => digit === '') || isLoading}
              onclick={verifyOTP}
            >
              {#if isLoading}
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              {:else}
                {purchaseInfo ? 'Verify & Proceed to Payment' : 'Verify & Continue'}
              {/if}
            </button>
          </div>

          <div class="mt-6 text-center">
            <p class="text-xs text-gray-500">
              For this demo, the OTP is <span class="font-semibold">1234</span>
            </p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
