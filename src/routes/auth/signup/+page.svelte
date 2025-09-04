<script lang="ts">
import { goto } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select'

let name = $state('')
let email = $state('')
let phone = $state('')
let bio = $state('')
let location = $state('')
let cuisineSpecialties = $state('')
let isLoading = $state(false)
let error = $state('')

// Validate form
function validateForm() {
  if (!name.trim()) {
    error = 'Name is required'
    return false
  }
  if (!email.trim()) {
    error = 'Email is required'
    return false
  }
  if (!phone.trim()) {
    error = 'Phone number is required'
    return false
  }
  if (!location.trim()) {
    error = 'Location is required'
    return false
  }
  error = ''
  return true
}

// Handle form submission
async function handleSubmit() {
  if (!validateForm()) return

  isLoading = true
  error = ''

  try {
    const signupData = {
      name,
      email,
      phone,
      bio,
      location,
      cuisineSpecialties: cuisineSpecialties.split(',').map(s => s.trim()).filter(s => s)
    }

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signupData)
    })

    const result = await response.json()

    if (result.success) {
      // Redirect to login page for phone verification
      goto('/auth/login')
    } else {
      error = result.message || 'Failed to create account'
    }
  } catch (err) {
    error = 'Failed to create account. Please try again.'
    console.error('Signup error:', err)
  } finally {
    isLoading = false
  }
}
</script>

<svelte:head>
  <title>Host Signup - HomeFood</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="flex justify-center">
      <a href="/" class="flex items-center">
        <span class="text-3xl font-bold text-green-700">HomeFood</span>
      </a>
    </div>

    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      Become a HomeFood Host
    </h2>

    <p class="mt-2 text-center text-sm text-gray-600">
      Share your homemade food with the community
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <form class="space-y-6" onsubmit={handleSubmit}>
        {#if error}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        {/if}

        <div>
          <Label for="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            required
            bind:value={name}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Label for="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            required
            bind:value={email}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <Label for="phone">Phone Number</Label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span class="text-gray-500 text-sm">+91</span>
            </div>
            <Input
              id="phone"
              type="tel"
              required
              bind:value={phone}
              placeholder="10-digit mobile number"
              maxlength={10}
              class="pl-12"
            />
          </div>
        </div>

        <div>
          <Label for="location">Location</Label>
          <Input
            id="location"
            type="text"
            required
            bind:value={location}
            placeholder="City, State"
          />
        </div>

        <div>
          <Label for="bio">Bio (Optional)</Label>
          <Textarea
            id="bio"
            bind:value={bio}
            placeholder="Tell us about yourself and your cooking..."
            rows={3}
          />
        </div>

        <div>
          <Label for="cuisine">Cuisine Specialties</Label>
          <Input
            id="cuisine"
            type="text"
            bind:value={cuisineSpecialties}
            placeholder="e.g., Indian, Italian, Chinese (comma separated)"
          />
        </div>

        <div>
          <Button
            type="submit"
            class="w-full"
            disabled={isLoading}
          >
            {#if isLoading}
              Creating Account...
            {:else}
              Create Host Account
            {/if}
          </Button>
        </div>

        <div class="text-center">
          <p class="text-sm text-gray-600">
            Already have an account?
            <a href="/auth/login" class="font-medium text-green-600 hover:text-green-500">
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  </div>
</div>