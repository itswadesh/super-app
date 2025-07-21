<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { X } from '@lucide/svelte'

const {
  isOpen,
  storeId,
  storeName,
  month,
  year = new Date().getFullYear(),
  dbName,
  close,
} = $props()

interface DailySale {
  store_id: string
  store_name: string
  country: string
  currency_code: string
  order_date: string
  no_of_orders: string
  total_payment_amount: number
  total_amount_inr: number
}

let dailySales = $state<DailySale[]>([])

let loading = $state(false)
let error = $state<string | null>(null)

const currentYear = new Date().getFullYear()

async function fetchDailySales() {
  try {
    loading = true
    error = null
    // TODO: Replace with actual API call
    const response = await fetch(
      `/api/litekart/stores/daily-sales?store_id=${storeId}&store_name=${storeName}&month=${month}&year=${year}&db_name=${dbName}`
    )
    if (!response.ok) throw new Error('Failed to fetch daily sales')
    dailySales = await response.json()
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load daily sales'
  } finally {
    loading = false
  }
}

$effect(() => {
  if (isOpen) {
    fetchDailySales()
  }
})

function formatDate(isoString: string) {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: dailySales[0]?.currency_code || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
</script>

{#if isOpen}
  <div 
  class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  onclick={() => close()}
>
    <div class="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
      <div class="relative p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-lg font-semibold">
              Daily Sales - {storeName} - {month} {year}
            </h2>
            {#if dailySales.length > 0}
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span>Currency: {dailySales[0].currency_code}</span>
                <span class="mx-2">•</span>
                <span>Country: {dailySales[0].country}</span>
              </div>
            {/if}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            class="absolute right-2 top-2"
            onclick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="Close modal">
            <X class="h-4 w-4" />
          </Button>
        </div>
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
                <th class="text-right p-3 font-medium">Amount ({dailySales[0]?.currency_code || 'USD'})</th>
                <th class="text-right p-3 font-medium">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              {#each dailySales as sale}
                <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="p-3">{formatDate(sale.order_date)}</td>
                  <td class="text-right p-3">{sale.no_of_orders}</td>
                  <td class="text-right p-3">{formatCurrency(sale.total_payment_amount)}</td>
                  <td class="text-right p-3">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(sale.total_amount_inr || 0)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
      
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <Button onclick={() => close()}>
          Close
        </Button>
      </div>
    </div>
  </div>
{/if}
