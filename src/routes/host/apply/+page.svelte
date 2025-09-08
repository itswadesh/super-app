<script lang="ts">
import { goto } from '$app/navigation'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

let { data }: Props = $props()

// Form state
let formData = $state({
  fullName: '',
  businessName: '',
  phone: data.user?.phone || '',
  address: '',
  agreeToTerms: false,
})

let isSubmitting = $state(false)
let submitError = $state('')
let submitSuccess = $state(false)

// Form validation
let formErrors = $state({
  fullName: '',
  businessName: '',
  phone: '',
  address: '',
  agreeToTerms: '',
})

function validateForm() {
  let isValid = true
  formErrors = {
    fullName: '',
    businessName: '',
    phone: '',
    address: '',
    agreeToTerms: '',
  }

  if (!formData.fullName.trim()) {
    formErrors.fullName = 'Full name is required'
    isValid = false
  }

  if (!formData.businessName.trim()) {
    formErrors.businessName = 'Business name is required'
    isValid = false
  }

  if (!formData.phone.trim()) {
    formErrors.phone = 'Business phone number is required'
    isValid = false
  } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
    formErrors.phone = 'Please enter a valid phone number'
    isValid = false
  }

  if (!formData.address.trim()) {
    formErrors.address = 'Address is required'
    isValid = false
  }

  if (!formData.agreeToTerms) {
    formErrors.agreeToTerms = 'You must agree to the terms and conditions'
    isValid = false
  }

  return isValid
}

async function submitApplication() {
  if (!validateForm()) {
    return
  }

  isSubmitting = true
  submitError = ''

  try {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: formData.fullName.trim(),
        businessName: formData.businessName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    submitSuccess = true

    // Redirect to host dashboard after a short delay
    setTimeout(() => {
      goto('/host')
    }, 2000)
  } catch (error) {
    console.error('Error submitting application:', error)
    submitError = error instanceof Error ? error.message : 'Failed to submit application'
  } finally {
    isSubmitting = false
  }
}
</script>

<svelte:head>
  <title>Apply to Become a Chef - HomeFood</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="container mx-auto px-4 max-w-2xl">
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Become a HomeFood Chef</h1>
      <p class="text-gray-600">Join our community of home chefs and start earning from your culinary passion</p>
    </div>

    {#if submitSuccess}
      <div class="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-green-800 mb-2">Application Submitted Successfully!</h2>
        <p class="text-green-700 mb-4">
          Thank you for your interest in becoming a HomeFood chef. Your application has been received and is under review.
        </p>
        <p class="text-sm text-green-600">
          You will be redirected to your dashboard shortly...
        </p>
      </div>
    {:else}
      <div class="bg-white rounded-lg shadow-lg">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Chef Application Form</h2>
          <p class="text-gray-600 mt-1">
            Please fill out all the required information below
          </p>
        </div>

        <form on:submit|preventDefault={submitApplication} class="p-6 space-y-4">
          {#if submitError}
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {submitError}
            </div>
          {/if}

          <div>
            <label for="fullName" class="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              id="fullName"
              type="text"
              bind:value={formData.fullName}
              placeholder="Enter your full name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              required
            />
            {#if formErrors.fullName}
              <p class="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
            {/if}
          </div>

          <div>
            <label for="businessName" class="block text-sm font-medium text-gray-700 mb-2">
              Business Name (Display Name) *
            </label>
            <input
              id="businessName"
              type="text"
              bind:value={formData.businessName}
              placeholder="e.g., John's Home Kitchen"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              required
            />
            {#if formErrors.businessName}
              <p class="text-red-500 text-sm mt-1">{formErrors.businessName}</p>
            {/if}
          </div>

          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
              Business Phone Number *
            </label>
            <input
              id="phone"
              type="tel"
              bind:value={formData.phone}
              placeholder="+91 9876543210"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              required
            />
            {#if formErrors.phone}
              <p class="text-red-500 text-sm mt-1">{formErrors.phone}</p>
            {/if}
          </div>

          <div>
            <label for="address" class="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <textarea
              id="address"
              bind:value={formData.address}
              placeholder="House number, street, landmark"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
              required
            ></textarea>
            {#if formErrors.address}
              <p class="text-red-500 text-sm mt-1">{formErrors.address}</p>
            {/if}
          </div>

          <div class="flex items-start space-x-3 pt-4">
            <input
              id="agreeToTerms"
              type="checkbox"
              bind:checked={formData.agreeToTerms}
              class="mt-1"
            />
            <div>
              <label for="agreeToTerms" class="text-sm font-medium text-gray-700">
                I agree to the Terms and Conditions *
              </label>
              <p class="text-xs text-gray-600 mt-1">
                By submitting this application, I agree to follow all food safety guidelines,
                maintain quality standards, and adhere to HomeFood's policies and procedures.
              </p>
              {#if formErrors.agreeToTerms}
                <p class="text-red-500 text-sm mt-1">{formErrors.agreeToTerms}</p>
              {/if}
            </div>
          </div>

          <div class="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              class="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {#if isSubmitting}
                <div class="flex items-center justify-center">
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </div>
              {:else}
                Submit Application
              {/if}
            </button>
          </div>
        </form>
      </div>
    {/if}
  </div>
</div>