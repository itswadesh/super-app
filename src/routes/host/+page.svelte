<script lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Button } from '$lib/components/ui/button'
import { Badge } from '$lib/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
import { Plus, ChefHat, ShoppingCart, Star, TrendingUp, Users } from '@lucide/svelte'
import { onMount } from 'svelte'

// Mock data for host dashboard
let hostStats = $state({
  totalFoods: 12,
  activeOrders: 5,
  totalOrders: 47,
  averageRating: 4.6,
  totalEarnings: 12500
})

let myFoods = $state([
  {
    id: '1',
    name: 'Homemade Butter Chicken',
    price: 250,
    status: 'available',
    orders: 15,
    rating: 4.8
  },
  {
    id: '2',
    name: 'Fresh Vegetable Biryani',
    price: 180,
    status: 'available',
    orders: 8,
    rating: 4.7
  },
  {
    id: '3',
    name: 'Italian Pasta Carbonara',
    price: 220,
    status: 'unavailable',
    orders: 3,
    rating: 4.3
  }
])

let recentOrders = $state([
  {
    id: '1',
    customerName: 'John Doe',
    foodName: 'Butter Chicken',
    quantity: 2,
    totalAmount: 500,
    status: 'preparing',
    orderTime: '2 hours ago'
  },
  {
    id: '2',
    customerName: 'Jane Smith',
    foodName: 'Vegetable Biryani',
    quantity: 1,
    totalAmount: 180,
    status: 'ready',
    orderTime: '1 hour ago'
  }
])

onMount(() => {
  // TODO: Fetch host data from API
})
</script>

<svelte:head>
  <title>Host Dashboard - HomeFood</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Host Dashboard</h1>
        <p class="text-gray-600">Manage your homemade food business</p>
      </div>
      <Button>
        <Plus class="w-4 h-4 mr-2" />
        Add New Food
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Foods</CardTitle>
          <ChefHat class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{hostStats.totalFoods}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Orders</CardTitle>
          <ShoppingCart class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{hostStats.activeOrders}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Orders</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{hostStats.totalOrders}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Average Rating</CardTitle>
          <Star class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{hostStats.averageRating}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Earnings</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">₹{hostStats.totalEarnings}</div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Content -->
    <Tabs value="foods" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="foods">My Foods</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="foods" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">My Food Items</h2>
          <Button variant="outline">
            <Plus class="w-4 h-4 mr-2" />
            Add Food
          </Button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each myFoods as food}
            <Card>
              <CardHeader>
                <div class="flex items-center justify-between">
                  <CardTitle class="text-lg">{food.name}</CardTitle>
                  <Badge variant={food.status === 'available' ? 'default' : 'secondary'}>
                    {food.status}
                  </Badge>
                </div>
                <CardDescription>₹{food.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span>{food.orders} orders</span>
                  <div class="flex items-center">
                    <Star class="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{food.rating}</span>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <Button variant="outline" size="sm" class="flex-1">Edit</Button>
                  <Button variant="outline" size="sm" class="flex-1">
                    {food.status === 'available' ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          {/each}
        </div>
      </TabsContent>

      <TabsContent value="orders" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Recent Orders</h2>
          <Button variant="outline">View All Orders</Button>
        </div>

        <div class="space-y-4">
          {#each recentOrders as order}
            <Card>
              <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-semibold">{order.customerName}</h3>
                    <p class="text-sm text-gray-600">{order.foodName} × {order.quantity}</p>
                    <p class="text-xs text-gray-500">{order.orderTime}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold">₹{order.totalAmount}</p>
                    <Badge variant={
                      order.status === 'preparing' ? 'default' :
                      order.status === 'ready' ? 'secondary' : 'outline'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                </div>
                <div class="flex space-x-2 mt-4">
                  <Button size="sm" variant="outline">View Details</Button>
                  {#if order.status === 'preparing'}
                    <Button size="sm">Mark as Ready</Button>
                  {:else if order.status === 'ready'}
                    <Button size="sm">Mark as Delivered</Button>
                  {/if}
                </div>
              </CardContent>
            </Card>
          {/each}
        </div>
      </TabsContent>

      <TabsContent value="analytics" class="space-y-4">
        <h2 class="text-xl font-semibold">Analytics</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-3xl font-bold text-green-600">₹8,500</div>
              <p class="text-sm text-gray-600">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Satisfaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-3xl font-bold">4.6</div>
              <p class="text-sm text-gray-600">Average rating</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</div>