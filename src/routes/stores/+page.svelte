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

<div class="container mx-auto py-6">
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
    <div class="rounded-md border overflow-auto">
      <Table class="min-w-[1200px]">
        <TableHeader>
          <TableRow>
            <TableHead>Store</TableHead>
            <TableHead>Country</TableHead>
            <TableHead class="text-right">Total Orders</TableHead>
            <TableHead class="text-right">Total Amount (INR)</TableHead>
            {#each months as month}
              <TableHead class="text-right">{month.toUpperCase()}</TableHead>
            {/each}
            <TableHead>Last Order</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each storeMetrics as store}
            <TableRow>
              <TableCell class="font-medium">{store.store_name}</TableCell>
              <TableCell>{store.country}</TableCell>
              <TableCell class="text-right">{store.total_orders}</TableCell>
              <TableCell class="text-right">{formatCurrency(store.total_amount_inr)}</TableCell>
              {#each months as month}
                <TableCell class="text-right">
                  {#if store[month]}
                    {store[month]}
                  {:else}
                    -
                  {/if}
                </TableCell>
              {/each}
              <TableCell>
                {store.last_order_date ? new Date(store.last_order_date).toLocaleDateString() : '-'}
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>
