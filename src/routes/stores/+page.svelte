<script lang="ts">
import { onMount } from 'svelte'
import { Button } from '$lib/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '$lib/components/ui/table'
import { Skeleton } from '$lib/components/ui/skeleton'

let loading = $state(true)
let error = $state<string | null>(null)
interface StoreMetric {
  store_name: string
  country: string
  jan?: string
  feb?: string
  mar?: string
  apr?: string
  may?: string
  jun?: string
  jul?: string
  aug?: string
  sep?: string
  oct?: string
  nov?: string
  dec?: string
  total_orders: number
  total_amount_inr: string
  last_order_date?: string
  currency?: string
  rate?: string
}

let storeMetrics = $state<StoreMetric[]>([])
const months = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const

onMount(async () => {
  try {
    const response = await fetch('/api/litekart/stores')
    if (!response.ok) {
      throw new Error('Failed to fetch store metrics')
    }
    const data = await response.json()
    storeMetrics = data.data || []
  } catch (err) {
    error = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    loading = false
  }
})

function formatCurrency(amount: string) {
  if (!amount) return '0'
  return new Intl.NumberFormat('en-IN').format(Number.parseInt(amount, 10))
}
</script>

<div class="w-full dark:bg-gray-900 min-h-screen">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold">Store Metrics</h1>
    <Button variant="outline">Export</Button>
  </div>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <span class="block sm:inline">{error}</span>
    </div>
  {:else if loading}
    <div class="space-y-4">
      {#each { length: 5 } as _, i}
        <Skeleton class="h-12 w-full" />
      {/each}
    </div>
  {:else if storeMetrics.length === 0}
    <div class="text-center py-12">
      <p class="text-muted-foreground">No store metrics available</p>
    </div>
  {:else}
    <div class="w-full overflow-auto">
      <Table class="w-full">
        <TableHeader class="bg-slate-900 dark:bg-slate-800">
          <TableRow class="hover:bg-slate-800 dark:hover:bg-slate-700">
            <TableHead class="text-white dark:text-slate-100">Store</TableHead>
            <TableHead class="text-white dark:text-slate-100">Currency</TableHead>
            <TableHead class="text-right text-white dark:text-slate-100">Total Orders</TableHead>
            <TableHead class="text-white dark:text-slate-100">Last Order</TableHead>
            {#each months as month}
              <TableHead class="text-right text-white dark:text-slate-100">{month.toUpperCase()}</TableHead>
            {/each}
          </TableRow>
        </TableHeader>
        <TableBody class="bg-white dark:bg-gray-900">
          {#each storeMetrics as store}
            <TableRow class="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              <TableCell class="font-medium text-gray-900 dark:text-white">{store.store_name} <span class="text-gray-500 dark:text-gray-400">({store.country})</span></TableCell>
              <TableCell class="font-medium text-gray-900 dark:text-white">{store.currency_code} <span class="text-gray-500 dark:text-gray-400">({store.rate})</span></TableCell>
              <TableCell class="text-right text-gray-900 dark:text-white">{formatCurrency(store.total_amount_inr)} <span class="text-gray-500 dark:text-gray-400">({store.total_orders})</span></TableCell>
              <TableCell>
                {#if store.last_order_date}
                  {new Date(store.last_order_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }).replace(/ /g, '-')}
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {#if store.currency}
                      {store.currency} {store.rate ? `(Rate: ${store.rate})` : ''}
                    {/if}
                  </div>
                {:else}
                  -
                {/if}
              </TableCell>
              {#each months as month}
                <TableCell class="text-right">
                  {#if store[month]}
                    {store[month]}
                  {:else}
                    -
                  {/if}
                </TableCell>
              {/each}
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>
