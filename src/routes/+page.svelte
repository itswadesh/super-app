<script lang="ts">
import { Input } from '$lib/components/ui/input'
import {
  Search,
  MessageCircle,
  Wallet,
  Hotel,
  ShoppingCart,
  Utensils,
  Bus,
  Train,
  Ship,
  UtensilsCrossed,
  Zap,
  ShieldCheck,
  ChefHat,
  Flame,
  Wifi,
  Smartphone,
  CreditCard,
  MoreHorizontal,
  Building2,
  Ticket,
  Receipt,
} from '@lucide/svelte'

// User data - would come from your auth store
let user = {
  name: 'John Doe',
  balance: '1,245.50',
  avatar: '/default-avatar.png',
}

// Featured services
const services = [
  { icon: Wallet, name: 'UPI Pay', color: 'bg-green-500' },
  { icon: Bus, name: 'Bus Tickets', color: 'bg-blue-500' },
  { icon: Train, name: 'Train Tickets', color: 'bg-yellow-500' },
  { icon: Ship, name: 'Ferry Booking', color: 'bg-red-500' },
  { icon: UtensilsCrossed, name: 'Restaurants', color: 'bg-purple-500' },
  { icon: Hotel, name: 'Hotels', color: 'bg-indigo-500' },
  { icon: Building2, name: 'Business Listings', color: 'bg-blue-400' },
  { icon: Zap, name: 'Electricity', color: 'bg-amber-500' },
  { icon: ShieldCheck, name: 'Insurance', color: 'bg-teal-500' },
  { icon: ChefHat, name: 'Home food', color: 'bg-pink-500' },
  { icon: Flame, name: 'Gas Booking', color: 'bg-orange-500' },
  { icon: Smartphone, name: 'Jio Recharge', color: 'bg-red-400' },
  { icon: Wifi, name: 'Internet', color: 'bg-emerald-500' },
  { icon: CreditCard, name: 'Bills', color: 'bg-rose-500' },
  { icon: Receipt, name: 'More Bills', color: 'bg-cyan-500' },
  { icon: MoreHorizontal, name: 'More', color: 'bg-gray-300' },
]

// Promotions
const promotions = [
  {
    id: 1,
    title: '50% OFF Hotels',
    description: 'Book now and save big!',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  {
    id: 2,
    title: 'Free Delivery',
    description: 'On all food orders',
    color: 'bg-gradient-to-r from-green-500 to-blue-500',
  },
]

// Recent transactions
const recentTransactions = [
  { id: 1, name: 'Starbucks', amount: '-$4.50', time: '10:30 AM', type: 'food' },
  { id: 2, name: 'Uber Ride', amount: '-$12.75', time: 'Yesterday', type: 'transport' },
  { id: 3, name: 'Salary', amount: '+$2,500.00', time: 'Jun 1', type: 'income' },
]
</script>

<div class="min-h-screen bg-gray-50">

  <main class="container mx-auto px-4 py-6">
    <!-- Balance Card -->
    <div class="bg-indigo-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
      <p class="text-sm opacity-80">Available Balance</p>
      <h2 class="text-3xl font-bold my-2">${user.balance}</h2>
      <div class="flex space-x-3 mt-4">
        <button class="bg-white text-indigo-600 px-4 py-2 rounded-full text-sm font-medium flex items-center">
          <span>+ Add Money</span>
        </button>
        <button class="border border-white text-white px-4 py-2 rounded-full text-sm font-medium">
          Send
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="relative mb-6">
      <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <Input 
        type="text" 
        placeholder="Search for services, places, or people" 
        class="w-full pl-10 bg-gray-100 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
      />
    </div>

    <!-- Services Grid -->
    <div class="grid grid-cols-4 gap-3 mb-8">
      {#each services as service}
        <button 
          class="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
          on:click={() => navigateToService(service.name.toLowerCase())}
        >
          <div class={`w-12 h-12 ${service.color} rounded-full flex items-center justify-center text-white mb-2`}>
            <svelte:component this={service.icon} class="w-6 h-6" />
          </div>
          <span class="text-xs text-gray-600">{service.name}</span>
        </button>
      {/each}
    </div>

    <!-- Recent Transactions -->
    <div class="bg-white rounded-2xl p-5 shadow-sm">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Recent Transactions</h2>
        <button class="text-sm text-indigo-600">See All</button>
      </div>
      
      <div class="space-y-4">
        {#each recentTransactions as tx}
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                {#if tx.type === 'food'}
                  <Utensils class="w-5 h-5 text-red-500" />
                {:else if tx.type === 'transport'}
                  <Bus class="w-5 h-5 text-blue-500" />
                {:else}
                  <Wallet class="w-5 h-5 text-green-500" />
                {/if}
              </div>
              <div>
                <p class="font-medium">{tx.name}</p>
                <p class="text-xs text-gray-500">{tx.time}</p>
              </div>
            </div>
            <span class={tx.amount.startsWith('+') ? 'text-green-500 font-medium' : 'text-gray-800'}>
              {tx.amount}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </main>

  <!-- Bottom Navigation -->
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2">
    <button class="flex flex-col items-center text-indigo-600">
      <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-1">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      </div>
      <span class="text-xs">Home</span>
    </button>
    <button class="flex flex-col items-center text-gray-500">
      <div class="w-10 h-10 rounded-full flex items-center justify-center mb-1">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <span class="text-xs">Discover</span>
    </button>
    <button class="flex flex-col items-center text-gray-500">
      <div class="w-10 h-10 rounded-full flex items-center justify-center mb-1">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <span class="text-xs">Activity</span>
    </button>
    <button class="flex flex-col items-center text-gray-500">
      <div class="w-10 h-10 rounded-full flex items-center justify-center mb-1">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <span class="text-xs">Profile</span>
    </button>
  </nav>
</div>

<style>
  /* Add custom styles here if needed */
  body {
    padding-bottom: 4.5rem; /* Height of bottom navigation */
    background-color: #f9fafb;
    max-width: 100%;
    overflow-x: hidden;
  }
</style>