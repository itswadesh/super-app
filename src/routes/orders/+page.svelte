<script lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Button } from '$lib/components/ui/button'
import { Badge } from '$lib/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
import { Clock, MapPin, Phone, Star, RefreshCw } from '@lucide/svelte'
import { onMount } from 'svelte'

// Mock data for orders
let orders = $state([
  {
    id: '1',
    orderNumber: 'HF001',
    status: 'delivered',
    totalAmount: 430,
    deliveryFee: 30,
    taxAmount: 20,
    items: [
      { name: 'Homemade Butter Chicken', quantity: 1, price: 250 },
      { name: 'Fresh Vegetable Biryani', quantity: 1, price: 180 },
    ],
    host: {
      name: 'Priya Sharma',
      phone: '+91 9876543210',
      location: 'Mumbai, Maharashtra',
    },
    deliveryAddress: 'HAL Township, Sunabeda, Odisha',
    estimatedDelivery: '6:00 PM - 9:30 PM',
    actualDelivery: '7:45 PM',
    specialInstructions: 'Please ring the doorbell twice',
    createdAt: '2024-01-15 6:00 PM',
  },
  {
    id: '2',
    orderNumber: 'HF002',
    status: 'preparing',
    totalAmount: 220,
    deliveryFee: 30,
    taxAmount: 10,
    items: [{ name: 'Italian Pasta Carbonara', quantity: 1, price: 220 }],
    host: {
      name: 'Maria Rossi',
      phone: '+91 9876543211',
      location: 'Bangalore, Karnataka',
    },
    deliveryAddress: 'HAL Township, Bangalore, Karnataka',
    estimatedDelivery: '6:00 PM - 9:30 PM',
    specialInstructions: '',
    createdAt: '2024-01-16 6:30 PM',
  },
])

let activeTab = $state('all')

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'confirmed':
      return 'bg-blue-100 text-blue-800'
    case 'preparing':
      return 'bg-orange-100 text-orange-800'
    case 'ready':
      return 'bg-green-100 text-green-800'
    case 'delivered':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function filteredOrders() {
  if (activeTab === 'all') return orders
  return orders.filter((order) => order.status === activeTab)
}

onMount(() => {
  // TODO: Fetch orders from API
})
</script>

<svelte:head>
  <title>My Orders - HomeFood</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">My Orders</h1>
      <p class="text-gray-600">Track your food orders and order history</p>
    </div>

    <!-- Order Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent class="pt-6">
          <div class="text-2xl font-bold">{orders.length}</div>
          <p class="text-xs text-muted-foreground">Total Orders</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <div class="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'delivered').length}
          </div>
          <p class="text-xs text-muted-foreground">Delivered</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <div class="text-2xl font-bold text-orange-600">
            {orders.filter(o => ['preparing', 'ready'].includes(o.status)).length}
          </div>
          <p class="text-xs text-muted-foreground">In Progress</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-6">
          <div class="text-2xl font-bold text-blue-600">
            ₹{orders.reduce((sum, order) => sum + order.totalAmount, 0)}
          </div>
          <p class="text-xs text-muted-foreground">Total Spent</p>
        </CardContent>
      </Card>
    </div>

    <!-- Orders List -->
    <Tabs value={activeTab} onValueChange={(value) => activeTab = value} class="w-full">
      <TabsList class="grid w-full grid-cols-4">
        <TabsTrigger value="all">All Orders</TabsTrigger>
        <TabsTrigger value="preparing">Preparing</TabsTrigger>
        <TabsTrigger value="ready">Ready</TabsTrigger>
        <TabsTrigger value="delivered">Delivered</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} class="space-y-4">
        {#each filteredOrders() as order}
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle class="text-lg">Order #{order.orderNumber}</CardTitle>
                  <CardDescription>{order.createdAt}</CardDescription>
                </div>
                <div class="text-right">
                  <Badge class={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <p class="text-lg font-bold mt-1">₹{order.totalAmount}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent class="space-y-4">
              <!-- Order Items -->
              <div>
                <h4 class="font-medium mb-2">Order Items</h4>
                <div class="space-y-2">
                  {#each order.items as item}
                    <div class="flex justify-between items-center">
                      <span class="text-sm">{item.name} × {item.quantity}</span>
                      <span class="text-sm font-medium">₹{item.price}</span>
                    </div>
                  {/each}
                </div>
                <div class="border-t pt-2 mt-2 space-y-1">
                  <div class="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>₹{order.deliveryFee}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>₹{order.taxAmount}</span>
                  </div>
                  <div class="flex justify-between font-medium">
                    <span>Total</span>
                    <span>₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              <!-- Host Info -->
              <div class="bg-gray-50 p-3 rounded-lg">
                <h4 class="font-medium mb-2">Host Information</h4>
                <div class="space-y-1 text-sm">
                  <div class="flex items-center">
                    <span class="font-medium mr-2">Name:</span>
                    <span>{order.host.name}</span>
                  </div>
                  <div class="flex items-center">
                    <Phone class="w-4 h-4 mr-2" />
                    <span>{order.host.phone}</span>
                  </div>
                  <div class="flex items-center">
                    <MapPin class="w-4 h-4 mr-2" />
                    <span>{order.host.location}</span>
                  </div>
                </div>
              </div>

              <!-- Delivery Info -->
              <div>
                <h4 class="font-medium mb-2">Delivery Information</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex items-start">
                    <MapPin class="w-4 h-4 mr-2 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </div>
                  <div class="flex items-center">
                    <Clock class="w-4 h-4 mr-2" />
                    <span>Estimated: {order.estimatedDelivery}</span>
                  </div>
                  {#if order.actualDelivery}
                    <div class="flex items-center">
                      <Clock class="w-4 h-4 mr-2" />
                      <span>Delivered: {order.actualDelivery}</span>
                    </div>
                  {/if}
                  {#if order.specialInstructions}
                    <div class="bg-yellow-50 p-2 rounded text-sm">
                      <strong>Special Instructions:</strong> {order.specialInstructions}
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex space-x-2 pt-4 border-t">
                <Button variant="outline" size="sm">View Details</Button>
                {#if order.status === 'delivered'}
                  <Button variant="outline" size="sm">
                    <Star class="w-4 h-4 mr-2" />
                    Rate Order
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw class="w-4 h-4 mr-2" />
                    Reorder
                  </Button>
                {:else if ['preparing', 'ready'].includes(order.status)}
                  <Button size="sm">Track Order</Button>
                {/if}
              </div>
            </CardContent>
          </Card>
        {:else}
          <div class="text-center py-12">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p class="text-gray-500 mb-4">You haven't placed any orders yet.</p>
            <Button href="/foods">Browse Foods</Button>
          </div>
        {/each}
      </TabsContent>
    </Tabs>
  </div>
</div>