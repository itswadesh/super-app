<script lang="ts">
export let title: string = 'No plans available'
export let description: string = 'There are no subscription plans available at the moment.'
export let action: { label: string; onClick: () => void } | null = null
</script>

<div class="text-center py-12">
  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <h3 class="mt-2 text-lg font-medium text-gray-900">{title}</h3>
  <p class="mt-1 text-sm text-gray-500">{description}</p>
  {#if action}
    <div class="mt-6">
      <button
        type="button"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        on:click={action.onClick}
      >
        {action.label}
      </button>
    </div>
  {/if}
</div>
