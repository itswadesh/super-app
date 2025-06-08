<script lang="ts">
  import type { UserSubscription } from '$lib/stores/subscriptionStore';
  import { format } from 'date-fns';
  
  // Props
  export let subscription: UserSubscription;
  export let onUpgrade: () => void;
  export let onCancel: () => void;

  // Format date
  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Calculate remaining days
  const getRemainingDays = (endDate: string | Date) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
</script>

<div class="max-w-3xl mx-auto">
  <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
    <!-- Subscription header -->
    <div class="bg-gradient-to-r from-purple-600 to-orange-500 px-6 py-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-white">Your Current Plan</h2>
        <span class="px-3 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">
          Active
        </span>
      </div>
    </div>

    <!-- Subscription details -->
    <div class="p-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-900">{subscription.planName || 'Premium Plan'}</h3>
          <p class="mt-1 text-gray-600">
            Next billing: {formatDate(subscription.endDate)}
          </p>
        </div>
        <div class="mt-4 md:mt-0">
          <p class="text-sm text-gray-500">Plan renews in</p>
          <p class="text-2xl font-bold text-gray-900">
            {getRemainingDays(subscription.endDate)} days
          </p>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mt-6">
        <div class="flex justify-between text-sm text-gray-600 mb-1">
          <span>Plan progress</span>
          <span>
            {getRemainingDays(subscription.endDate)} days remaining
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            class="bg-gradient-to-r from-purple-500 to-orange-500 h-2.5 rounded-full" 
            style={`width: ${Math.min(100, (getRemainingDays(subscription.endDate) / 365) * 100)}%`}
          ></div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          on:click={onUpgrade}
          class="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
        >
          Upgrade Plan
        </button>
        <button
          on:click={onCancel}
          class="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel Subscription
        </button>
      </div>
    </div>
  </div>
</div>
