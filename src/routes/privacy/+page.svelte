<script lang="ts">
  import { goto } from '$app/navigation'
</script>

<svelte:head>
  <title>Privacy Policy - Misiki</title>
  <meta name="description" content="Privacy policy for Misiki platform" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="bg-white shadow-lg rounded-lg p-8">
      <h1 class="text-3xl font-bold text-center mb-8">Privacy Policy</h1>

      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p>
          <p>This may include:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>Name and contact information</li>
            <li>Account credentials</li>
            <li>Usage data and preferences</li>
            <li>Device and browser information</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>Communicate with you about products, services, and promotions</li>
            <li>Monitor and analyze usage patterns</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">3. Information Sharing</h2>
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
          <p>We may share your information in the following circumstances:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>With service providers who assist us in operating our platform</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
            <li>In connection with a business transfer</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">4. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          <p>However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">5. Data Retention</h2>
          <p>We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required by law.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict certain processing of your information</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">7. Cookies and Tracking</h2>
          <p>We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts.</p>
          <p>You can control cookie settings through your browser preferences.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">8. Third-Party Services</h2>
          <p>Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">9. Children's Privacy</h2>
          <p>Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">11. Contact Us</h2>
          <p>If you have any questions about this privacy policy, please contact us at:</p>
          <p class="mt-2">Email: privacy@misiki.com</p>
          <p>Address: [Your Business Address]</p>
        </section>
      </div>

      <div class="mt-8 pt-6 border-t text-center">
        <div class="mb-4">
          <p class="text-sm text-gray-600 mb-2">Other Policies</p>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onclick={() => goto('/terms')}
              class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
            >
              Terms & Conditions
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