<script lang="ts">
  import { goto } from '$app/navigation'
</script>

<svelte:head>
  <title>Shipping Policy - Misiki</title>
  <meta name="description" content="Shipping policy and delivery information for Misiki" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="bg-white shadow-lg rounded-lg p-8">
      <h1 class="text-3xl font-bold text-center mb-8">Shipping Policy</h1>

      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-semibold mb-3">1. Shipping Methods</h2>
          <p>We offer the following shipping options:</p>
          <ul class="list-disc ml-6 mt-2">
            <li><strong>Standard Shipping</strong>: 5-7 business days - Free on orders over ₹500</li>
            <li><strong>Express Shipping</strong>: 2-3 business days - ₹100 additional charge</li>
            <li><strong>Same Day Delivery</strong>: Available in select cities - ₹200 additional charge</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">2. Processing Time</h2>
          <p>Orders are typically processed within 1-2 business days. Processing time may be extended during peak seasons or holidays.</p>
          <p>You will receive an email confirmation with tracking information once your order ships.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">3. Shipping Costs</h2>
          <p>Shipping costs are calculated based on:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>Order weight and dimensions</li>
            <li>Delivery location</li>
            <li>Selected shipping method</li>
          </ul>
          <p>Free shipping is available on orders over ₹500 within India.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">4. Delivery Areas</h2>
          <p>We currently ship to all major cities and towns across India. Some remote areas may have extended delivery times.</p>
          <p>International shipping is not available at this time.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">5. Tracking Your Order</h2>
          <p>Once your order ships, you will receive a tracking number via email and SMS. You can track your package using our tracking system or the carrier's website.</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">6. Delivery Issues</h2>
          <p>If you experience any issues with delivery:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>Contact our customer service within 48 hours of delivery</li>
            <li>Provide order number and description of the issue</li>
            <li>We will work with the carrier to resolve the issue</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">7. Damaged or Missing Items</h2>
          <p>If your package arrives damaged or items are missing:</p>
          <ul class="list-disc ml-6 mt-2">
            <li>Take photos of the damaged package and contents</li>
            <li>Contact us within 24 hours of delivery</li>
            <li>We will arrange for replacement or refund</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold mb-3">8. Contact Information</h2>
          <p>For shipping-related inquiries:</p>
          <p class="mt-2">Email: shipping@misiki.com</p>
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