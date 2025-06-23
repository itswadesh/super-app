<script lang="ts">
export let activeTab: 'monthly' | 'yearly' = 'monthly'
export let onTabChange: (tab: 'monthly' | 'yearly') => void
export let plans: { monthly: any[]; yearly: any[] }

const tabs = [
  { id: 'monthly', name: 'Monthly', count: plans.monthly.length },
  { id: 'yearly', name: 'Yearly', count: plans.yearly.length },
]
</script>

<div class="border-b border-gray-200">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex space-x-8">
      {#each tabs as tab}
        <button
          type="button"
          class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none"
          class:border-primary-500 text-gray-900={activeTab === tab.id}
          class:border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300={activeTab !== tab.id}
          on:click={() => onTabChange(tab.id as 'monthly' | 'yearly')}
        >
          {tab.name}
          {tab.count > 0 && (
            <span class="ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {tab.count}
            </span>
          )}
        </button>
      {/each}
    </div>
  </div>
</div>
