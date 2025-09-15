<script lang="ts">
  import { goto } from '$app/navigation'

  let name = $state('')
  let email = $state('')
  let subject = $state('')
  let message = $state('')
  let isSubmitting = $state(false)
  let submitMessage = $state('')

  async function handleSubmit(e: Event) {
    e.preventDefault()
    isSubmitting = true

    try {
      // Here you would typically send the form data to your backend
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000))

      submitMessage = 'Thank you for your message! We\'ll get back to you soon.'
      name = ''
      email = ''
      subject = ''
      message = ''
    } catch (error) {
      submitMessage = 'Sorry, there was an error sending your message. Please try again.'
    } finally {
      isSubmitting = false
    }
  }
</script>

<svelte:head>
  <title>Contact Us - Misiki</title>
  <meta name="description" content="Contact Misiki for support and inquiries" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="bg-white shadow-lg rounded-lg overflow-hidden">
      <div class="px-6 py-8 sm:px-10">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
          <p class="text-gray-600">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Contact Information -->
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Get in Touch</h2>

            <div class="space-y-4">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Address</p>
                  <p class="text-sm text-gray-600">123 Business Street<br />Tech City, TC 12345<br />India</p>
                </div>
              </div>

              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Phone</p>
                  <p class="text-sm text-gray-600">+91-XXXXXXXXXX</p>
                </div>
              </div>

              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Email</p>
                  <p class="text-sm text-gray-600">support@misiki.com</p>
                </div>
              </div>

              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Business Hours</p>
                  <p class="text-sm text-gray-600">Monday - Saturday: 9 AM - 6 PM IST<br />Sunday: Closed</p>
                </div>
              </div>
            </div>

            <div class="mt-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
              <div class="space-y-2">
                <button onclick={() => goto('/shipping')} class="block text-sm text-indigo-600 hover:text-indigo-800">Shipping Policy</button>
                <button onclick={() => goto('/refund')} class="block text-sm text-indigo-600 hover:text-indigo-800">Refund Policy</button>
                <button onclick={() => goto('/terms')} class="block text-sm text-indigo-600 hover:text-indigo-800">Terms & Conditions</button>
                <button onclick={() => goto('/privacy')} class="block text-sm text-indigo-600 hover:text-indigo-800">Privacy Policy</button>
              </div>
            </div>
          </div>

          <!-- Contact Form -->
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Send us a Message</h2>

            {#if submitMessage}
              <div class="mb-6 p-4 rounded-md {submitMessage.includes('error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}">
                {submitMessage}
              </div>
            {/if}

            <form onsubmit={handleSubmit} class="space-y-4">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  bind:value={name}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  bind:value={email}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  id="subject"
                  bind:value={subject}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="How can we help you?"
                />
              </div>

              <div>
                <label for="message" class="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  id="message"
                  bind:value={message}
                  required
                  rows="5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Please describe your inquiry in detail..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        <div class="mt-12 pt-8 border-t border-gray-200 text-center">
          <button
            onclick={() => goto('/')}
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  </div>
</div>