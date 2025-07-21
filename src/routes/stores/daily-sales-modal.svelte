<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { X } from '@lucide/svelte'
  
  const props = $props<{
    isOpen: boolean
    storeName: string
    month: string
    year?: number
  }>()
  
  const emit = $bind()
  
  let dailySales = $state([
    { date: '2025-07-01', orders: 5, amount: 12500 },
    { date: '2025-07-02', orders: 3, amount: 7500 },
    // Add more mock data as needed
  ])

  let loading = $state(false)
  let error = $state<string | null>(null)
  
  const currentYear = new Date().getFullYear()

  async function fetchDailySales() {
    try {
      loading = true
      error = null
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/daily-sales?store=${storeName}&month=${month}&year=${year}`)
      // if (!response.ok) throw new Error('Failed to fetch daily sales')
      // dailySales = await response.json()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load daily sales'
    } finally {
      loading = false
    }
  }

  $effect(() => {
    if (props.isOpen) {
      fetchDailySales()
    }
  })

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      weekday: 'short'
    })
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN').format(amount)
  }
</script>

{#if isOpen}
  <div 
  class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  on:click|stopPropagation
  on:click|self={() => emit('close')}
>
    <div class="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold">
          Daily Sales - {storeName} - {month} {year}
        </h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onclick={() => emit('close')}
          aria-label="Close modal">
          <X class="h-4 w-4" />
        </Button>
      </div>
      
      <div class="max-h-[60vh] overflow-y-auto">
        {#if loading}
          <div class="p-8 text-center">
            <div class="animate-pulse space-y-4">
              {#each { length: 5 } as _}
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              {/each}
            </div>
          </div>
        {:else if error}
          <div class="p-4 text-red-500 text-center">
            {error}
          </div>
        {:else if dailySales.length === 0}
          <div class="p-8 text-center text-gray-500">
            No daily sales data available
          </div>
        {:else}
          <table class="w-full">
            <thead class="sticky top-0 bg-white dark:bg-gray-900">
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left p-3 font-medium">Date</th>
                <th class="text-right p-3 font-medium">Orders</th>
                <th class="text-right p-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {#each dailySales as sale}
                <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="p-3">{formatDate(sale.date)}</td>
                  <td class="text-right p-3">{sale.orders}</td>
                  <td class="text-right p-3">₹{formatCurrency(sale.amount)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
      
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <Button onclick={() => emit('close')}>
          Close
        </Button>
      </div>
    </div>
  </div>
{/if}
