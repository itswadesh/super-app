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
  { icon: Wallet, name: 'CCC Contracts', href: '/ccc/contracts', color: 'bg-green-500' },
  // { icon: Bus, name: 'Bus Tickets', color: 'bg-blue-500' },
  // { icon: Train, name: 'Train Tickets', color: 'bg-yellow-500' },
  // { icon: Ship, name: 'Ferry Booking', color: 'bg-red-500' },
  // { icon: UtensilsCrossed, name: 'Restaurants', color: 'bg-purple-500' },
  // { icon: Hotel, name: 'Hotels', color: 'bg-indigo-500' },
  // { icon: Building2, name: 'Business Listings', color: 'bg-blue-400' },
  // { icon: Zap, name: 'Electricity', color: 'bg-amber-500' },
  // { icon: ShieldCheck, name: 'Insurance', color: 'bg-teal-500' },
  // { icon: ChefHat, name: 'Home food', color: 'bg-pink-500' },
  // { icon: Flame, name: 'Gas Booking', color: 'bg-orange-500' },
  // { icon: Smartphone, name: 'Jio Recharge', color: 'bg-red-400' },
  // { icon: Wifi, name: 'Internet', color: 'bg-emerald-500' },
  // { icon: CreditCard, name: 'Bills', color: 'bg-rose-500' },
  // { icon: Receipt, name: 'More Bills', color: 'bg-cyan-500' },
  // { icon: MoreHorizontal, name: 'More', color: 'bg-gray-300' },
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
    <!-- Search -->
    <!-- <div class="relative mb-6">
      <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <Input 
        type="text" 
        placeholder="Search for services, places, or people" 
        class="w-full pl-10 bg-gray-100 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
      />
    </div> -->

    <!-- Services Grid -->
    <div class="grid grid-cols-4 gap-3 mb-8">
      {#each services as service}
        <a 
          class="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
          href={service.href}
        >
          <div class={`w-12 h-12 ${service.color} rounded-full flex items-center justify-center text-white mb-2`}>
            <svelte:component this={service.icon} class="w-6 h-6" />
          </div>
          <span class="text-xs text-gray-600">{service.name}</span>
        </a>
      {/each}
    </div>
  </main>
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