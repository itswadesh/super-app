<script lang="ts">
  import { goto } from '$app/navigation'
</script>

<svelte:head>
  <title>Refund Policy - Misiki</title>
  <meta name="description" content="Refund policy and return information for Misiki" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="bg-white shadow-lg rounded-lg p-8">
      <h1 class="text-3xl font-bold text-center mb-8">Refund Policy</h1>

      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-semibold mb-3">1. Return Window</h2>
          <p>You can return most items within 30 days of delivery for a full refund or exchange. Some items may have different return policies.</p>
          <p>Items must be in their original condition, unused, and in the original packaging.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">2. Non-Returnable Items</h2>
          <p>The following items cannot be returned:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>Perishable goods (food, flowers, etc.)</li>
            <li>Personal care items</li>
            <li>Digital products or services</li>
            <li>Items damaged due to misuse</li>
            <li>Items without original packaging</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">3. Return Process</h2>
          <p>To initiate a return:</p>
          <ol class="list-decimal ml-6 mt-2">
            <li>Contact our customer service team</li>
            <li>Provide your order number and reason for return</li>
            <li>Receive a return authorization and shipping label</li>
            <li>Pack the item securely in its original packaging</li>
            <li>Ship the item using the provided label</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">4. Refund Processing</h2>
          <p>Once we receive your returned item:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>Items are inspected within 2-3 business days</li>
            <li>Approved refunds are processed within 5-7 business days</li>
            <li>Refunds are issued to the original payment method</li>
            <li>You will receive an email confirmation when refund is processed</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">5. Exchange Policy</h2>
          <p>We offer exchanges for the same item in a different size, color, or variant, subject to availability.</p>
          <p>If the exchange item is of higher value, you will be charged the difference. If lower value, a refund will be issued for the difference.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">6. Damaged or Defective Items</h2>
          <p>If you receive a damaged or defective item:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>Contact us within 48 hours of delivery</li>
            <li>Provide photos of the damage</li>
            <li>We will arrange for replacement or full refund</li>
            <li>No return shipping costs for damaged items</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">7. Refund Methods</h2>
          <p>Refunds are processed using the original payment method:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>Credit/Debit Cards: 5-7 business days</li>
            <li>UPI/Digital Wallets: 1-2 business days</li>
            <li>Net Banking: 3-5 business days</li>
            <li>Cash on Delivery: Bank transfer (additional details required)</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">8. Cancellation Policy</h2>
          <p>Orders can be cancelled within 24 hours of placement if not yet shipped.</p>
          <p>For shipped orders, please refer to our return policy above.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">9. Contact Information</h2>
          <p>For refund and return inquiries:</p>
          <p class="mt-2">Email: refunds@misiki.com</p>
          <p>Phone: +91-XXXXXXXXXX</p>
          <p>Hours: Monday - Saturday, 9 AM - 6 PM IST</p>
        </section>
      </div>

      <div class="mt-8 pt-6 border-t text-center">
        <button
          type="button"
          onclick={() => goto('/')}
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded mr-4"
        >
          Back to Home
        </button>
        <button
          type="button"
          onclick={() => goto('/contact')}
          class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
        >
          Contact Us
        </button>
      </div>
    </div>
  </div>
</div>