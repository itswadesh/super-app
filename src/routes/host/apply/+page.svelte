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

    <div class="bg-white rounded-lg shadow-lg">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Chef Application Form</h2>
        <p class="text-gray-600 mt-1">
          Please fill out all the required information below
        </p>
      </div>

      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            placeholder="your.email@example.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            placeholder="+91 9876543210"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <textarea
            placeholder="House number, street, landmark"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
            required
          ></textarea>
        </div>

        <div class="flex items-start space-x-3 pt-4">
          <input type="checkbox" class="mt-1" />
          <div>
            <label class="text-sm font-medium text-gray-700">
              I agree to the Terms and Conditions *
            </label>
            <p class="text-xs text-gray-600 mt-1">
              By submitting this application, I agree to follow all food safety guidelines,
              maintain quality standards, and adhere to HomeFood's policies and procedures.
            </p>
          </div>
        </div>
      </div>

      <div class="p-6 pt-0">
        <button class="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Submit Application
        </button>
      </div>
    </div>
  </div>
</div>