<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import Button from '$lib/components/ui/button/button.svelte'
import * as InputOTP from '$lib/components/ui/input-otp'
import Input from '$lib/components/ui/input/input.svelte'
import { authService } from '$lib/services/auth-service'
import { loginModal } from '$lib/stores/loginModal'
import { userStore } from '$lib/stores/userStore'
import { tick } from 'svelte'
import { toast } from 'svelte-sonner'
import * as Dialog from '$lib/components/ui/dialog'
import { dev } from '$app/environment'
import { delay } from '$lib/utils'

// Import types
import type { User } from '$lib/stores/userStore'

// Define API response user type that extends our base User type
interface ApiUser extends Omit<NonNullable<User>, 'metadata'> {
  metadata?: {
    board?: string
    class?: string
  }
}

// State using Svelte 5 runes
let phoneNumber = $state(dev ? '8895092508' : '')
let otp = $state(dev ? '' : '')
let otpError = $state('')
let phoneError = $state('')
let showOtpVerification = $state(false)
let isLoading = $state(false)
let resendCooldown = $state(0)
let phoneInput = $state<HTMLInputElement | null>(null)
let cooldownInterval: ReturnType<typeof setInterval> | null = $state(null)

let otpCooldownRemainingTime = $state(0)

async function showOtpError(error: any) {
  otpCooldownRemainingTime = error?.remainingTime
  for (let i = otpCooldownRemainingTime; i >= 0; i--) {
    otpCooldownRemainingTime = i
    await delay(1000)
  }
}

// Focus management effect
$effect(() => {
  if ($loginModal.isOpen) {
    if (!showOtpVerification && phoneInput) {
      // Focus phone input when modal opens in phone number mode
      const timer = setTimeout(() => phoneInput?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }
  return undefined
})

// Close dialog and reset state
function handleClose() {
  // Reset form state
  phoneNumber = dev ? '8895092508' : ''
  otp = ''
  otpError = ''
  phoneError = ''
  showOtpVerification = false
  isLoading = false

  // Clear any existing intervals
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
    cooldownInterval = null
  }

  // Close the modal
  loginModal.close()
  window.location.reload()
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

// Handle phone number submission
async function handlePhoneSubmit(e: Event) {
  e.preventDefault()

  // Validate phone number (simple validation)
  if (!phoneNumber || phoneNumber.length < 10) {
    phoneError = 'Please enter a valid phone number'
    phoneInput?.focus()
    return
  }

  // Clear any existing errors
  phoneError = ''
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
      showOtpError(result)
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

// Verify entered OTP
async function verifyOTP() {
  // Check if OTP is complete
  if (otp.length !== 4) {
    otpError = 'Please enter the complete 4-digit OTP'
    // Focus back to OTP input if not complete
    const otpInput = document.querySelector('input[data-testid="otp-input"]') as HTMLInputElement
    otpInput?.focus()
    return
  }

  // Clear any existing errors
  otpError = ''
  isLoading = true

  try {
    // Use the auth service to verify OTP
    const result = await authService.verifyOtp(phoneNumber, otp)

    if (result.success) {
      // Update user store with the received user data
      if (result.user) {
        const apiUser = result.user as ApiUser

        // Create user data matching the User type from userStore
        const userData: NonNullable<User> = {
          id: apiUser.id,
          name: apiUser.name || 'User',
          phone: apiUser.phone || phoneNumber,
          email: apiUser.email,
          role: apiUser.role || 'user',
          board: apiUser.board || apiUser.metadata?.board,
          class: apiUser.class || apiUser.metadata?.class
        }

        // Update the store with the user data
        userStore.updateUser(userData)
      }

      console.log('res', result)
      // Show success message
      toast.success('Successfully logged in')

      if (result.success && result.user) {
        // Safely get user metadata with proper typing
        const user = result.user as UserWithMetadata
        const userBoard = user.metadata?.board || ''
        const userClass = user.metadata?.class || ''
        let redirectAfter = '/dashboard'

        if (userBoard === 'CBSE') {
          redirectAfter = '/cbse'
        } else if (userBoard === 'WBBSE' || userBoard === 'BSE') {
          if (userClass === '11' || userClass === '12') {
            redirectAfter = '/wbchse'
          } else {
            redirectAfter = '/wbbse'
          }
        } else if (userBoard === 'BSE') {
          if (userClass === '11' || userClass === '12') {
            redirectAfter = '/chse'
          } else {
            redirectAfter = '/bse'
          }
        }

        // Close the modal and redirect
        loginModal.close()
        window.location.reload()
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

<Dialog.Root
  open={$loginModal.isOpen}
  onOpenChange={(open) => {
    if (!open) {
      handleClose();
    } else {
      loginModal.open();
    }
  }}
>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/80 dark:bg-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Dialog.Content
      class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white dark:bg-gray-900 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:max-w-[425px] sm:rounded-lg dark:border-gray-800"
      onEscapeKeyDown={(e: KeyboardEvent) => e.preventDefault()}
      onPointerDownOutside={(e: PointerEvent) => e.preventDefault()}
      onOpenAutoFocus={(e: Event) => e.preventDefault()}
    >
      <Dialog.Header class="text-center">
        <Dialog.Title class="text-xl font-semibold text-gray-900 dark:text-white">
          {showOtpVerification ? 'Verify Your Phone Number' : 'Login to Super App'}
        </Dialog.Title>
        {#if !showOtpVerification}
          <Dialog.Description class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sign in to continue to your account
          </Dialog.Description>
        {/if}
      </Dialog.Header>
    {#if !showOtpVerification}
      <!-- Phone Number Input Form -->
      <form
        class="animate-fadeIn"
        onsubmit={(e) => {
          e.preventDefault();
          if (isPhoneNumberValid(phoneNumber) && !isLoading) {
            handlePhoneSubmit(e);
          }
        }}
      >
        <div class="mt-3">
          <label
            for="phone"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left"
            >
            Phone Number
            </label>
          <div class="relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3">
              <div class="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-indigo-500 dark:text-indigo-400 mr-1"
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
                  class="h-5 w-5 text-green-500 dark:text-green-400"
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
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-16 pr-10 py-3 text-base focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 sm:text-sm transition-colors duration-200"
              placeholder="Enter your mobile number"
              inputmode="numeric"
              maxlength="10"
              disabled={isLoading}
            />
          </div>
          {#if phoneNumber && !isPhoneNumberValid(phoneNumber)}
            <p class="mt-2 text-sm text-red-600 dark:text-red-400">{phoneError}</p>
          {/if}
        </div>

        <div class="mt-6">
          <Button
            type="submit"
            variant="default"
            size="lg"
            class="w-full bg-gray-600 text-white relative overflow-visible"
            disabled={otpCooldownRemainingTime || isLoading || !isPhoneNumberValid(phoneNumber)}
            aria-busy={isLoading}
          >
            <span class={isLoading ? 'invisible' : 'visible'}>
              {#if otpCooldownRemainingTime}
                Please wait {otpCooldownRemainingTime}s to request new OTP
              {:else}
                Send OTP
              {/if}

            </span>
            {#if isLoading}
              <span class="absolute inset-0 flex items-center justify-center">
                <svg
                  class="animate-spin h-5 w-5 text-white"
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
              </span>
            {/if}
          </Button>
        </div>
      </form>

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              Using LRNR for the first time?
            </span>
          </div>
        </div>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Don't worry, we'll create an account for you automatically.
          </p>
        </div>

        <div class="mt-4 text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            By clicking send OTP, you are accepting our{' '}
            <a
              href="/legal/terms-and-conditions"
              class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline"
              onclick={(e) => {
                e.preventDefault();
                loginModal.close();
                goto('/terms');
              }}
            >
              terms and conditions
            </a>
          </p>
        </div>
      </div>
    {:else}
      <!-- OTP Verification Form -->
      <div class="animate-fadeIn space-y-4">
        <div class="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
          <p class="text-sm text-gray-700 dark:text-gray-200 text-center mb-4">
            We've sent a 4-digit OTP to
            <span class="font-medium text-indigo-700 dark:text-indigo-300">+91 {phoneNumber}</span>
          </p>

          <!-- OTP Input -->
          <div class="mb-4">
            <div class="flex justify-center">
              <InputOTP.Root
                maxlength={4}
                value={otp}
                onValueChange={handleOtpChange}
                class="[&>div]:justify-between [&>div]:w-full"
              >
                {#snippet children({ cells })}
                  <InputOTP.Group class="gap-2">
                    {#each cells as cell (cell)}
                      <InputOTP.Slot 
                        {cell} 
                        class="h-12 w-12 text-lg font-medium border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    {/each}
                  </InputOTP.Group>
                {/snippet}
              </InputOTP.Root>
            </div>
            {#if otpError}
              <p class="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{otpError}</p>
            {/if}
          </div>

          <div class="flex items-center justify-between text-sm">
            <button
              type="button"
              class="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              onclick={() => (showOtpVerification = false)}
              disabled={isLoading}
            >
              ← Change Number
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              disabled={isLoading || resendCooldown > 0}
              onclick={resendOTP}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>

        {#if dev}
          <div class="mt-6 text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              For this demo, the OTP is <span class="font-semibold text-gray-700 dark:text-gray-200">1111</span>
            </p>
          </div>
        {/if}

        <Button
          variant="default"
          size="lg"
          class="w-full bg-gray-600 text-white mt-4"
          disabled={isLoading}
          onclick={verifyOTP}
        >
          {#if isLoading}
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
    {/if}
  </Dialog.Content>
</Dialog.Portal>
</Dialog.Root>
