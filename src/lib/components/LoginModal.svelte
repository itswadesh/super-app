<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import { authService } from '$lib/services/auth-service'
import { loginModal } from '$lib/stores/loginModal'
import { userStore } from '$lib/stores/userStore'
import { tick } from 'svelte'
import Modal from './Modal.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import Input from '$lib/components/ui/input/input.svelte'
import * as InputOTP from '$lib/components/ui/input-otp'
import { toast } from 'svelte-sonner'

// State using Svelte 5 runes
let phoneNumber = $state('')
let otp = $state('')
let otpError = $state('')
let phoneError = $state('')
let showOtpVerification = $state(false)
let isLoading = $state(false)
let resendCooldown = $state(0)
let phoneInput = $state<HTMLInputElement | null>(null)
let cooldownInterval: NodeJS.Timeout | null = $state(null)

// Focus on the phone input when modal opens
$effect(() => {
  if ($loginModal.isOpen && !showOtpVerification && phoneInput) {
    setTimeout(() => phoneInput?.focus(), 100)
  }
})

// Close modal and reset state
function handleClose() {
  phoneNumber = ''
  otp = ''
  otpError = ''
  phoneError = ''
  showOtpVerification = false
  isLoading = false
  resetCooldownTimer()
  loginModal.close()
}

// Start cooldown timer for OTP resend
function startCooldownTimer() {
  // Store the timestamp of this OTP request
  const now = Date.now()
  resendCooldown = 30 // Reset to 30 seconds

  // Clear any existing interval
  if (cooldownInterval) clearInterval(cooldownInterval)

  // Set up new interval to decrease cooldown every second
  cooldownInterval = setInterval(() => {
    if (resendCooldown > 0) {
      resendCooldown -= 1
    } else {
      resetCooldownTimer()
    }
  }, 1000) as unknown as NodeJS.Timeout
}

// Reset cooldown timer
function resetCooldownTimer() {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
    cooldownInterval = null
  }
}

// Check if phone number is valid (pure function)
function isPhoneNumberValid(number: string): boolean {
  if (!number || number.trim() === '') return false
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(number)
}

// Update phone error state
function updatePhoneError() {
  if (!phoneNumber || phoneNumber.trim() === '') {
    phoneError = 'Please enter a phone number'
  } else if (!isPhoneNumberValid(phoneNumber)) {
    phoneError = 'Please enter a valid 10-digit mobile number'
  } else {
    phoneError = ''
  }
}

// Handle phone number input
function handlePhoneInput(e: Event) {
  const target = e.target as HTMLInputElement
  phoneNumber = target.value
  updatePhoneError()
}

// Send OTP to user's phone
async function sendOTP() {
  if (!isPhoneNumberValid(phoneNumber)) return

  // Check for rate limiting - 30 seconds between requests
  const now = Date.now()
  const timeSinceLastRequest = now - (cooldownInterval?.startTime ?? 0)
  if (cooldownInterval && timeSinceLastRequest < 30000) {
    const remainingSeconds = Math.ceil((30000 - timeSinceLastRequest) / 1000)
    toast.error(`Please wait ${remainingSeconds} seconds before requesting another OTP`)
    return
  }

  isLoading = true

  try {
    // Use the auth service to send OTP
    const result = await authService.sendOtp(phoneNumber)

    if (result.success) {
      // Start the cooldown timer
      startCooldownTimer()

      // Show success message
      toast.success('OTP sent successfully')

      // Show OTP verification form after a small delay to allow toast to show
      await tick()
      showOtpVerification = true

      // Focus is handled automatically by the shadcn OTP component
    } else {
      toast.error(result.message || 'Failed to send OTP. Please try again.')
    }
  } catch (error) {
    console.error('Error sending OTP:', error)
    toast.error('Failed to send OTP. Please try again.')
  } finally {
    isLoading = false
  }
}

// Handle OTP input change
function handleOtpChange(value: string) {
  otp = value
  otpError = ''

  // Auto-submit when 4 digits are entered
  if (value.length === 4) {
    verifyOTP()
  }
}

// Keyboard handling is now managed by the shadcn OTP component

// Verify entered OTP
async function verifyOTP() {
  // Check if OTP is complete
  if (otp.length !== 4) {
    otpError = 'Please enter the complete 4-digit OTP'
    return
  }

  isLoading = true

  try {
    // Use the auth service to verify OTP
    const result = await authService.verifyOtp(phoneNumber, otp)

    if (result.success) {
      // Update user store with the received user data
      userStore.updateUser(result.user)

      // Show success message
      toast.success('Successfully logged in')

      // Invalidate any cached data
      await invalidateAll()

      // Check if user has board and class preferences set
      const needsPreferences = !hasBoard || !hasClass

      if (needsPreferences) {
        // User needs to set preferences
        let redirectAfter = '/'

        // Store the original redirect destination
        if ($loginModal.redirectUrl && $loginModal.redirectUrl !== '/') {
          redirectAfter = $loginModal.redirectUrl
        } else if ($loginModal.purchaseInfo) {
          // If login was from a purchase flow, we'll need to redirect to payment after preferences
          redirectAfter = `/payment?board=${$loginModal.purchaseInfo.board}&price=${$loginModal.purchaseInfo.price}`
        }

        // Close the modal and redirect to preferences
        loginModal.close()
        goto(`/user-preferences?redirect=${encodeURIComponent(redirectAfter)}`)
      } else if ($loginModal.redirectUrl && $loginModal.redirectUrl !== '/') {
        // User has preferences and has a redirect URL
        loginModal.close()
        goto($loginModal.redirectUrl)
      } else if ($loginModal.purchaseInfo) {
        // If login was from a purchase flow, redirect to payment
        loginModal.close()
        goto(
          `/payment?board=${$loginModal.purchaseInfo.board}&price=${$loginModal.purchaseInfo.price}`
        )
      } else {
        // Default case - just close the modal
        setTimeout(() => {
          handleClose()
        }, 1000)
      }

      // Handle purchase flow if applicable
      if ($loginModal.purchaseInfo) {
        console.log('Proceeding with purchase:', $loginModal.purchaseInfo)
      }
    } else {
      // OTP validation failed
      otpError = result.message || 'Invalid OTP. Please try again.'
      otp = ''
      toast.error(otpError)
    }
  } catch (error) {
    console.error('Error verifying OTP:', error)
    otpError = 'An error occurred. Please try again.'
    // Clear OTP on error
    otp = ''
  } finally {
    isLoading = false
  }
}

// Resend OTP
async function resendOTP() {
  // Check if cooldown is active
  if (resendCooldown > 0) {
    toast.info(`Please wait ${resendCooldown} seconds before resending OTP`)
    return
  }

  isLoading = true

  try {
    // Use auth service to resend OTP
    const result = await authService.sendOtp(phoneNumber)

    if (result.success) {
      // Reset OTP fields
      otp = ''
      otpError = ''

      // Start the cooldown timer again
      startCooldownTimer()

      // Show success message
      toast.success('OTP resent successfully')

      // Focus is handled automatically by the shadcn OTP component
    } else {
      toast.error(result.message || 'Failed to resend OTP. Please try again.')
    }
  } catch (error) {
    console.error('Error resending OTP:', error)
    toast.error('Failed to resend OTP. Please try again.')
  } finally {
    isLoading = false
  }
}
</script>

{#if $loginModal.isOpen}
  <Modal
    open={true}
    title={showOtpVerification ? "Verify Your Phone Number" : "Login to Super App"}
    closeOnClickOutside={false}
    size="sm"
    onClose={handleClose}
  >
    {#if !showOtpVerification}
      <!-- Phone Number Input Form -->
      <form
        class="animate-fadeIn"
        onsubmit={(e) => {
          e.preventDefault();
          if (isPhoneNumberValid(phoneNumber) && !isLoading) {
            sendOTP();
          }
        }}
      >
        <div class="mt-3">
          <label
            for="phone"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Phone Number</label
          >
          <div class="relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3">
              <div class="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-indigo-500 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span class="text-gray-500 sm:text-sm font-medium">+91</span>
              </div>
            </div>

            {#if phoneNumber && isPhoneNumberValid(phoneNumber)}
              <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-green-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            {/if}

            <input
              type="tel"
              id="phone"
              bind:this={phoneInput}
              bind:value={phoneNumber}
              oninput={handlePhoneInput}
              class="block w-full pl-16 pr-10 py-3 border-0 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white sm:text-sm transition-all duration-200 appearance-none"
              placeholder="Enter your mobile number"
              autocomplete="tel"
              inputmode="numeric"
              maxlength="10"
              disabled={isLoading}
            />
          </div>
          {#if phoneNumber && !isPhoneNumberValid(phoneNumber)}
            <p class="mt-2 text-sm text-red-600">{phoneError}</p>
          {/if}
        </div>

        <div class="mt-6">
          <Button
            type="submit"
            class="w-full flex justify-center py-3 px-4 border-0 rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all duration-200 transform hover:scale-[1.02] cursor-pointer disabled:cursor-not-allowed"
            disabled={!isPhoneNumberValid(phoneNumber) || isLoading}
          >
            {#if isLoading}
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Sending OTP...
            {:else}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                />
                <path
                  d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
                />
              </svg>
              Send OTP
            {/if}
          </Button>
        </div>
      </form>

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500"
              >Using Super App for the first time?</span
            >
          </div>
        </div>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Don't worry, we'll create an account for you automatically.
          </p>
        </div>

        <div class="mt-4 text-center">
          <p class="text-xs text-gray-500">
            By clicking send OTP, you are accepting our <a
              href="/terms"
              class="text-indigo-600 hover:text-indigo-500 underline"
              onclick={(e) => {
                e.preventDefault();
                loginModal.close();
                goto("/terms");
              }}>terms and conditions</a
            >
          </p>
        </div>
      </div>
    {:else}
      <!-- OTP Verification Form -->
      <div class="animate-fadeIn space-y-6">
        <div
          class="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100"
        >
          <div class="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-indigo-500 mr-3 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <div class="flex-1">
              <p class="text-sm text-gray-700">
                We've sent a 4-digit OTP to
                <span class="font-semibold text-indigo-700 block mt-1"
                  >+91 {phoneNumber}</span
                >
              </p>
            </div>
          </div>

          <!-- OTP Input -->
          <div class="mt-6">
            <label
              for="otp"
              class="block text-sm font-medium text-gray-700 mb-2"
              >Enter OTP</label
            >
            <div class="flex justify-center space-x-2">
              <div class="flex justify-center">
                <InputOTP.Root
                  maxlength={4}
                  value={otp}
                  onValueChange={handleOtpChange}
                  class="[&>div]:justify-between [&>div]:w-full"
                >
                  {#snippet children({ cells })}
                    <InputOTP.Group>
                      {#each cells as cell (cell)}
                        <InputOTP.Slot {cell} />
                      {/each}
                    </InputOTP.Group>
                  {/snippet}
                </InputOTP.Root>
              </div>
            </div>
            {#if otpError}
              <p class="mt-2 text-sm text-red-600">{otpError}</p>
            {/if}
          </div>

          <div class="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-md"
              onclick={() => (showOtpVerification = false)}
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 mr-1.5 -ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 111.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clip-rule="evenodd"
                />
              </svg>
              Change Number
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-md"
              disabled={isLoading || resendCooldown > 0}
              onclick={resendOTP}
            >
              {#if resendCooldown > 0}
                <span>Resend OTP in {resendCooldown}s</span>
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-1.5 -ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clip-rule="evenodd"
                  />
                </svg>
                Resend OTP
              {/if}
            </Button>
          </div>
        </div>

        <div class="mt-6">
          <Button
            variant="default"
            size="lg"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={otp.length !== 4 || isLoading}
            onclick={verifyOTP}
          >
            {#if isLoading}
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Verifying...
            {:else}
              Verify OTP
            {/if}
          </Button>
        </div>

        <div class="mt-6 text-center">
          <p class="text-xs text-gray-500">
            For this demo, the OTP is <span class="font-semibold">1111</span>
          </p>
        </div>
      </div>
    {/if}
  </Modal>
{/if}
