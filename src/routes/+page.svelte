<script lang="ts">
import { ChefHat, Flame, Receipt, ShoppingCart } from '@lucide/svelte'

// Featured services
const _services = [
  {
    icon: ChefHat,
    name: 'Browse Food',
    href: '/foods',
    color: 'bg-gradient-to-br from-yellow-400 to-orange-500',
  },
  {
    icon: Receipt,
    name: 'My Orders',
    href: '/orders',
    color: 'bg-gradient-to-br from-green-400 to-teal-500',
  },
  {
    icon: Flame,
    name: 'Host Food',
    href: '/host',
    color: 'bg-gradient-to-br from-blue-400 to-indigo-500',
  },
  {
    icon: ShoppingCart,
    name: 'Cart',
    href: '/cart',
    color: 'bg-gradient-to-br from-purple-400 to-pink-500',
  },
]

// Promotions
const _promotions = [
  {
    id: 1,
    title: 'Welcome to HomeFood',
    description: 'Discover amazing homemade food from local chefs',
    color: 'promo1',
    buttonText: 'Explore Now',
    href: '/foods',
  },
  {
    id: 2,
    title: 'Fast Delivery',
    description: 'Delivery to HAL Township between 6PM to 9:30PM',
    color: 'promo2',
    buttonText: 'Order Now',
    href: '/foods',
  },
  {
    id: 3,
    title: 'Become a Chef',
    description: 'Share your cooking skills and joy',
    color: 'promo3',
    buttonText: 'Join Now',
    href: '/host',
  },
]
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">

  <main class="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
    <!-- Search -->
    <!-- <div class="relative mb-4 sm:mb-6">
      <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
      <Input
        type="text"
        placeholder="Search for services, places, or people"
        class="w-full pl-10 bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500 text-gray-900 dark:text-white text-sm sm:text-base"
      />
    </div> -->

    <!-- Services Grid - Zomato Style -->
    <div class="grid grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {#each _services as service}
        <a
          class="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-400 transition-all duration-200 group"
          href={service.href}
        >
          <div class="w-12 h-12 sm:w-14 sm:h-14 {service.color} rounded-full flex items-center justify-center text-white mb-2 sm:mb-3 transition-colors">
            <svelte:component this={service.icon} class="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <span class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium text-center leading-tight group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{service.name}</span>
        </a>
      {/each}
    </div>

    <!-- Promotions - Elegant Watermark Style -->
    <div class="mb-6 sm:mb-8 relative">
      <!-- Watermark Background -->
      <div class="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-200 via-yellow-100 to-pink-100 dark:from-orange-900 dark:via-yellow-900 dark:to-pink-900 rounded-2xl"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl sm:text-8xl font-bold text-orange-300 dark:text-orange-700 opacity-20 select-none">
          🍽️
        </div>
        <div class="absolute top-1/4 right-1/4 text-4xl sm:text-6xl font-bold text-yellow-300 dark:text-yellow-700 opacity-15 select-none">
          👨‍🍳
        </div>
        <div class="absolute bottom-1/4 left-1/4 text-4xl sm:text-6xl font-bold text-pink-300 dark:text-pink-700 opacity-15 select-none">
          🏠
        </div>
      </div>

      <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 relative z-10">What's on your mind?</h2>
      <div class="grid grid-cols-1 gap-4 sm:gap-6 relative z-10">
        {#each _promotions as promo}
          <div class="{promo.color} p-4 sm:p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm">
            <h3 class="font-bold text-lg sm:text-xl mb-2 drop-shadow-lg">{promo.title}</h3>
            <p class="text-sm sm:text-base opacity-95 drop-shadow-md">{promo.description}</p>
            <div class="mt-4 inline-flex items-center text-sm font-medium bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/30 transition-all duration-200">
              <a href={promo.href} class="flex items-center text-white hover:text-yellow-100">
                <span>{promo.buttonText}</span>
                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </a>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </main>
</div>

<style>
  /* Add custom styles here if needed */
  body {
    padding-bottom: 4.5rem; /* Height of bottom navigation */
    background: linear-gradient(135deg, #e0f2fe 0%, #f3e8ff 50%, #fce7f3 100%);
    max-width: 100%;
    overflow-x: hidden;
  }

  @media (prefers-color-scheme: dark) {
    body {
      background: linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%);
    }
  }

  .promo1 {
    background: linear-gradient(to right, #fb923c, #eab308, #ef4444);
  }

  .promo2 {
    background: linear-gradient(to right, #22c55e, #3b82f6);
  }

  .promo3 {
    background: linear-gradient(to right, #a855f7, #ec4899);
  }
</style>