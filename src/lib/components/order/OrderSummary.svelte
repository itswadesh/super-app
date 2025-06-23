<script lang="ts">
import { orderStore } from '$lib/stores/orderStore'
import { formatCurrency } from '$lib/utils/format'

interface OrderItem {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  image?: string
}

interface Order {
  id: string
  status: string
  items: OrderItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  createdAt: string
  couponCode?: string
}

const {
  orderId = null,
  order = null,
  showHeader = true,
  showActions = false,
} = $props<{
  orderId?: string | null
  order?: Order | null
  showHeader?: boolean
  showActions?: boolean
}>()

const orderData = $derived(order || $orderStore.currentOrder)
const items = $derived(orderData?.items || [])
const orderDate = $derived(orderData ? new Date(orderData.createdAt).toLocaleDateString() : '')

$effect(() => {
  if (!orderData && orderId) {
    orderStore.getOrder(orderId)
  }
})

async function handleCancel() {
  if (confirm('Are you sure you want to cancel this order?')) {
    // In a real app, you would call orderStore.cancelOrder(orderId)
    alert('Order cancellation would be processed here')
  }
}
</script>

<div class="bg-white rounded-lg shadow overflow-hidden">
  {#if showHeader}
    <div class="px-6 py-5 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">Order Summary</h3>
      {#if orderData}
        <p class="mt-1 text-sm text-gray-500">
          Order #{orderData.id.slice(0, 8)} • {orderDate}
          <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {orderData.status}
          </span>
        </p>
      {/if}
    </div>
  {/if}
  
  <div class="px-6 py-5">
    <div class="flow-root">
      <ul role="list" class="-my-6 divide-y divide-gray-200">
        {#each items as item}
          <li class="py-6 flex">
            <div class="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
              {#if item.image}
                <img src={item.image} alt={item.name} class="w-full h-full object-cover object-center" />
              {:else}
                <div class="w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              {/if}
            </div>

            <div class="ml-4 flex-1 flex flex-col">
              <div>
                <div class="flex justify-between text-base font-medium text-gray-900">
                  <h3>{item.name}</h3>
                  <p class="ml-4">{formatCurrency(item.price * item.quantity)}</p>
                </div>
                {#if item.description}
                  <p class="mt-1 text-sm text-gray-500">{item.description}</p>
                {/if}
              </div>
              <div class="flex-1 flex items-end justify-between text-sm">
                <p class="text-gray-500">Qty {item.quantity}</p>
                <div class="flex">
                  <button type="button" class="font-medium text-primary-600 hover:text-primary-500">
                    View details
                  </button>
                </div>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    </div>

    <div class="border-t border-gray-200 mt-6 pt-6">
      <div class="flex justify-between text-base font-medium text-gray-900">
        <p>Subtotal</p>
        <p>{formatCurrency(orderData?.subtotal || 0)}</p>
      </div>
      {#if orderData?.discount > 0}
        <div class="flex justify-between text-base font-medium text-gray-900 mt-2">
          <p class="flex items-center">
            Discount
            {#if orderData.couponCode}
              <span class="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {orderData.couponCode}
              </span>
            {/if}
          </p>
          <p class="text-green-600">-{formatCurrency(orderData.discount)}</p>
        </div>
      {/if}
      {#if orderData?.tax > 0}
        <div class="flex justify-between text-base font-medium text-gray-900 mt-2">
          <p>Tax</p>
          <p>{formatCurrency(orderData.tax)}</p>
        </div>
      {/if}
      <div class="flex justify-between text-lg font-bold text-gray-900 mt-4 pt-4 border-t border-gray-200">
        <p>Total</p>
        <p>{formatCurrency(orderData?.total || 0)}</p>
      </div>
    </div>

    {#if showActions}
      <div class="mt-6">
        <button
          type="button"
          on:click={handleCancel}
          class="w-full bg-white border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel Order
        </button>
      </div>
    {/if}
  </div>
</div>
