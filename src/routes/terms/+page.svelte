<script lang="ts">
import { goto } from '$app/navigation'
</script>

<svelte:head>
  <title>Terms and Conditions - Misiki</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="bg-white shadow-lg rounded-lg p-8">
      <h1 class="text-3xl font-bold text-center mb-8">Terms and Conditions</h1>

      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using Misiki, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">2. Use License</h2>
          <p>Permission is granted to temporarily use Misiki for personal, non-commercial transitory viewing only.</p>
          <p>This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>modify or copy the materials</li>
            <li>use the materials for any commercial purpose or for any public display</li>
            <li>attempt to reverse engineer any software contained on Misiki</li>
            <li>remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">3. Disclaimer</h2>
          <p>The materials on Misiki are provided on an 'as is' basis. Misiki makes no warranties, expressed or implied.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">4. Limitations</h2>
          <p>In no event shall Misiki or its suppliers be liable for any damages arising out of the use or inability to use Misiki.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">5. Governing Law</h2>
          <p>These terms and conditions are governed by applicable laws.</p>
        </section>
      </div>

      <div class="mt-8 pt-6 border-t text-center">
        <div class="mb-4">
          <p class="text-sm text-gray-600 mb-2">Other Policies</p>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onclick={() => goto('/privacy')}
              class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onclick={() => goto('/shipping')}
              class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
            >
              Shipping Policy
            </button>
            <button
              type="button"
              onclick={() => goto('/refund')}
              class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
            >
              Refund Policy
            </button>
            <button
              type="button"
              onclick={() => goto('/contact')}
              class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
            >
              Contact Us
            </button>
          </div>
        </div>
        <button
          type="button"
          onclick={() => goto('/')}
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          Back to Home
        </button>
      </div>
    </div>
  </div>
</div>