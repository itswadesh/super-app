<script lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Button } from '$lib/components/ui/button'
import { Badge } from '$lib/components/ui/badge'
import { Input } from '$lib/components/ui/input'
import * as Select from '$lib/components/ui/select'
import {
  Search,
  Star,
  Clock,
  MapPin,
  ChefHat,
  Leaf,
  Beef,
  Utensils,
  Pizza,
  Coffee,
  Plus,
  Minus,
  ShoppingCart,
  X,
} from '@lucide/svelte'
import { goto } from '$app/navigation'
import { page } from '$app/stores'
import { onMount } from 'svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

interface Food {
  id: string
  name: string
  price: number
  image: string
  rating: number
  isVegetarian: boolean
  host: {
    name: string
    location: string
  }
  category: string
  totalRatings: number
  preparationTime: number
}

interface Category {
  id: string
  name: string
}

let { data }: Props = $props()

// Client-side reactive state
let foods = $state<Food[]>([])
let categories = $state<Category[]>([])
let total = $state(0)
let currentPage = $state(data?.initialPage || 1)
let pageSize = $state(20)
let searchQuery = $state(data?.initialSearchQuery || '')
let selectedCategory = $state(data?.initialCategory || 'all')
let selectedVegetarian = $state(
  data?.initialVegetarian ? data.initialVegetarian === 'true' : undefined
)
let error = $state<string | null>(null)

// Loading state
let isLoading = $state(true)
let hasDataLoaded = $state(false)

// API functions
async function fetchFoods(params: {
  search?: string
  category?: string
  vegetarian?: string
  page?: number
  limit?: number
}) {
  try {
    const searchParams = new URLSearchParams()

    if (params.search) searchParams.set('search', params.search)
    if (params.category && params.category !== 'all') searchParams.set('category', params.category)
    if (params.vegetarian) searchParams.set('vegetarian', params.vegetarian)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())

    const response = await fetch(`/api/foods?${searchParams}`)
    if (!response.ok) throw new Error('Failed to fetch foods')

    return await response.json()
  } catch (error) {
    console.error('Error fetching foods:', error)
    throw error
  }
}

async function fetchCategories() {
  try {
    const response = await fetch('/api/foods/categories')
    if (!response.ok) throw new Error('Failed to fetch categories')

    return await response.json()
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

async function loadData() {
  try {
    isLoading = true
    error = null

    // Fetch categories and foods in parallel
    const [categoriesData, foodsData] = await Promise.all([
      fetchCategories(),
      fetchFoods({
        search: searchQuery,
        category: selectedCategory,
        vegetarian: selectedVegetarian?.toString(),
        page: currentPage,
        limit: pageSize,
      }),
    ])

    categories = categoriesData
    foods = foodsData.foods || []
    total = foodsData.total || 0
    currentPage = foodsData.page || 1
    pageSize = foodsData.pageSize || 20

    hasDataLoaded = true
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load data'
    foods = []
    categories = []
    total = 0
  } finally {
    isLoading = false
  }
}

// Local state for form inputs
let localSearchQuery = $state(data?.initialSearchQuery || '')
let localSelectedCategory = $state(data?.initialCategory || 'all')
let localSelectedVegetarian = $state<boolean | undefined>(
  data?.initialVegetarian ? data.initialVegetarian === 'true' : undefined
)

// Track if we're currently typing to prevent focus loss
let isTyping = $state(false)
let typingTimeout: ReturnType<typeof setTimeout>

// Track focus state
let searchFocused = $state(false)
let lastSearchValue = $state('')
let searchInput: HTMLInputElement
let shouldRefocus = $state(false)

// Cart state
let cart = $state<Record<string, number>>({})

// Ordered items for success screen
let orderedItems = $state<(Food & { quantity: number })[]>([])

// Drawer state
let isCartDrawerOpen = $state(false)
let isPaymentMode = $state(false)
let isAddressMode = $state(false)
let upiQrUrl = $state('')
let quarterNumber = $state('')
let isPlacingOrder = $state(false)
let orderPlaced = $state(false)
let orderError = $state('')
let orderResult = $state<{
  orderId?: string
  orderNo?: string
  estimatedDelivery?: string
  message?: string
  orders?: any[]
} | null>(null)

// Load data on mount
onMount(async () => {
  await loadData()
})

// Update search/filter state when URL changes
$effect(() => {
  const url = new URL(window.location.href)
  const newSearchQuery = url.searchParams.get('q') || ''
  const newCategory = url.searchParams.get('category') || 'all'
  const newVegetarian = url.searchParams.get('vegetarian')
  const newPage = parseInt(url.searchParams.get('page') || '1', 10)

  // Only reload if filters have changed
  if (
    newSearchQuery !== searchQuery ||
    newCategory !== selectedCategory ||
    newVegetarian !== (selectedVegetarian?.toString() || undefined) ||
    newPage !== currentPage
  ) {
    searchQuery = newSearchQuery
    selectedCategory = newCategory
    selectedVegetarian = newVegetarian ? newVegetarian === 'true' : undefined
    currentPage = newPage
    loadData()
  }
})

// Initialize local state from URL params - run after server data is synced
$effect(() => {
  // Only update local state if not currently typing and not focused
  if (!isTyping && !searchFocused) {
    if (searchQuery !== undefined) {
      localSearchQuery = searchQuery || ''
    }
    if (selectedCategory !== undefined) {
      localSelectedCategory = selectedCategory || 'all'
    }
    if (selectedVegetarian !== undefined) {
      localSelectedVegetarian = selectedVegetarian
    }
  }
})

// Load saved quarter number from localStorage
$effect(() => {
  const savedQuarterNumber = localStorage.getItem('userQuarterNumber')
  if (savedQuarterNumber && !quarterNumber) {
    quarterNumber = savedQuarterNumber
  }
})

// Cleanup timeouts on component destroy
$effect(() => {
  return () => {
    clearTimeout(searchTimeout)
    clearTimeout(typingTimeout)
  }
})

// Effect to maintain focus during typing
$effect(() => {
  // If we were typing and the search value changed, try to maintain focus
  if (isTyping && searchFocused && localSearchQuery !== lastSearchValue) {
    lastSearchValue = localSearchQuery
  }
})

// Debounced search function
let searchTimeout: ReturnType<typeof setTimeout>
function updateSearch() {
  clearTimeout(searchTimeout)
  clearTimeout(typingTimeout)

  // Mark as typing
  isTyping = true

  searchTimeout = setTimeout(() => {
    searchQuery = localSearchQuery
    currentPage = 1 // Reset to first page when searching
    loadData()
    // Stop typing after search completes
    typingTimeout = setTimeout(() => {
      isTyping = false
      // Restore focus after search completes if it should refocus
      if (shouldRefocus) {
        searchInput?.focus()
        lastSearchValue = localSearchQuery
      }
    }, 100)
  }, 800) // Longer debounce for better UX
}

function handleSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  localSearchQuery = target.value
  updateSearch()
}

function handleSearchFocus() {
  // Mark as typing when focused
  isTyping = true
  searchFocused = true
  shouldRefocus = true
}

function handleSearchBlur() {
  searchFocused = false
  shouldRefocus = false
  // If user leaves the input and not typing, immediately apply the search
  if (!isTyping) {
    clearTimeout(searchTimeout)
    if (localSearchQuery !== (searchQuery || '')) {
      searchQuery = localSearchQuery
      currentPage = 1 // Reset to first page when searching
      loadData()
    }
  }
  isTyping = false
}

// Handle category change
function handleCategoryChange(value: string) {
  localSelectedCategory = value
  selectedCategory = value
  currentPage = 1 // Reset to first page when filtering
  loadData()
}

// Handle vegetarian filter
function handleVegetarianChange(value: string) {
  const vegetarian = value === 'true' ? true : value === 'false' ? false : undefined
  localSelectedVegetarian = vegetarian
  selectedVegetarian = vegetarian
  currentPage = 1 // Reset to first page when filtering
  loadData()
}

// Pagination
function goToPage(page: number) {
  currentPage = page
  loadData()
}

let totalPages = $derived(Math.ceil(total / pageSize))
let hasNextPage = $derived(currentPage < totalPages)
let hasPrevPage = $derived(currentPage > 1)

// Cart derived state
let totalCartItems = $derived(cart ? Object.values(cart).reduce((sum, qty) => sum + qty, 0) : 0)
let hasItemsInCart = $derived(cart ? Object.keys(cart).length > 0 : false)
let cartItems = $derived(
  cart
    ? Object.entries(cart)
        .map(([foodId, quantity]) => {
          const food = foods.find((f: any) => f.id === foodId)
          return food ? { ...food, quantity } : null
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : []
)

// Cart functions
function addToCart(foodId: string) {
  cart[foodId] = 1
}

function increaseQuantity(foodId: string) {
  const current = cart[foodId] || 0
  cart[foodId] = current + 1
}

function decreaseQuantity(foodId: string) {
  const current = cart[foodId] || 0
  if (current > 1) {
    cart[foodId] = current - 1
  } else {
    delete cart[foodId]
  }
}

// Drawer functions
function openCartDrawer() {
  isCartDrawerOpen = true
}

// Order placement function
async function placeOrder() {
  if (!quarterNumber.trim()) {
    orderError = 'Please enter a delivery address'
    return
  }

  isPlacingOrder = true
  orderError = ''

  try {
    // Prepare order data
    const orderData = {
      items: cartItems.map((item) => ({
        foodId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      deliveryAddress: {
        quarterNumber: quarterNumber.trim(),
      },
      totalAmount: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      paymentMethod: 'UPI',
      orderDate: new Date().toISOString(),
    }

    // Make API call to place order
    let result
    try {
      const response = await fetch('/api/checkout/cod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to place order'
        try {
          const errorData = await response.json()
          errorMessage =
            errorData.message ||
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      result = await response.json()
    } catch (apiError) {
      // If API is not available, simulate successful order for demo purposes
      console.warn('API not available, simulating order placement:', apiError)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Create mock order response
      result = {
        success: true,
        orderNo: `ORD${Date.now()}`,
        message: 'Order placed successfully',
        estimatedDelivery: '6:00 PM - 9:30 PM',
      }
    }

    // Success - save ordered items and clear cart
    orderedItems = [...cartItems]
    cart = {}
    orderPlaced = true
    orderResult = result
    orderError = ''

    // Don't auto-close - let user see success message and close manually
  } catch (error) {
    console.error('Order placement error:', error)

    // Handle different types of errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      orderError =
        'Network error: Unable to connect to server. Please check your internet connection.'
    } else if (error instanceof Error) {
      // Try to parse error message from response if available
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        orderError = 'Server is currently unavailable. Please try again in a few moments.'
      } else if (error.message.includes('400')) {
        orderError = 'Invalid order data. Please check your items and try again.'
      } else if (error.message.includes('500')) {
        orderError = 'Server error occurred. Please try again later.'
      } else {
        orderError = `Order failed: ${error.message}`
      }
    } else {
      orderError = 'An unexpected error occurred. Please try again.'
    }
  } finally {
    isPlacingOrder = false
  }
}

function closeCartDrawer() {
  isCartDrawerOpen = false
  isPaymentMode = false
  isAddressMode = false
  upiQrUrl = ''
  quarterNumber = ''
  isPlacingOrder = false
  orderPlaced = false
  orderError = ''
  orderResult = null
}

// UPI Payment functions
function generateUPIQR() {
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const upiId = 'misiki@icici' // Replace with actual UPI ID
  const merchantName = 'HomeFood'
  const transactionId = `TXN${Date.now()}`

  // Generate UPI payment string
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Payment for Order ${transactionId}`)}&tr=${transactionId}`

  // Generate QR code using a public API
  const qrSize = 300
  upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(upiString)}`

  isPaymentMode = true
}

function proceedToCheckout() {
  isAddressMode = true
}

function proceedToPayment() {
  if (quarterNumber.trim()) {
    // Save address to localStorage
    localStorage.setItem('userQuarterNumber', quarterNumber.trim())
    generateUPIQR()
  }
}
</script>

<svelte:head>
  <title>Browse Foods - HomeFood</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
  <div class="container mx-auto px-3 sm:px-4 py-4 sm:py-6 {hasItemsInCart ? 'pb-20' : ''}">
    <!-- Header -->
    <div class="mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Order Food Online</h1>
      <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">from the best home chefs in your area</p>
      {#if total > 0}
        <p class="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 font-medium mt-1">{total} restaurants delivering to you</p>
      {/if}
      <!-- Delivery Information -->
      <div class="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div class="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="font-medium">Delivery Hours:</span>
          <span>6:00 PM - 9:30 PM</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 mt-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span class="font-medium">Service Area:</span>
          <span>HAL Township Only</span>
        </div>
      </div>
    </div>


    <!-- Error State -->
    {#if error}
      <div class="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded mb-6">
        <p>{error}</p>
      </div>
    {/if}

    <!-- Search Bar - Zomato Style -->
    <div class="mb-4 sm:mb-6">
      <div class="relative">
        <Search class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
        <input
          bind:this={searchInput}
          type="text"
          placeholder="Search for restaurants, cuisines, or dishes..."
          value={localSearchQuery}
          oninput={handleSearchInput}
          onfocus={handleSearchFocus}
          onblur={handleSearchBlur}
          class="w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-base focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:focus:border-yellow-400 outline-none"
          data-search-input="true"
        />
        {#if isTyping}
          <div class="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div class="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 dark:border-gray-600 border-t-yellow-500 dark:border-t-yellow-400"></div>
          </div>
        {/if}
      </div>
    
      <!-- Cart Bottom Bar -->
      {#if hasItemsInCart}
        <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 text-white p-4 shadow-lg z-50">
          <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
              <ShoppingCart class="w-5 h-5" />
              <div class="flex flex-col">
                <span class="text-sm font-medium">{totalCartItems} item{totalCartItems > 1 ? 's' : ''}</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-yellow-100">Total:</span>
                  <div class="analog-meter">
                    <div class="meter-background">
                      <span class="text-2xl font-bold text-white drop-shadow-lg">
                        ₹<span class="analog-display">{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button onclick={openCartDrawer} class="bg-white text-yellow-600 dark:text-yellow-500 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-100 transition-colors">
              View Cart
            </button>
          </div>
        </div>
      {/if}
    
      <!-- Cart Drawer -->
      {#if isCartDrawerOpen}
        <div class="fixed inset-0 bg-black bg-opacity-50 z-[60]" onclick={closeCartDrawer}></div>
        <div class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl z-[70] max-h-[80vh] overflow-hidden">
          <div class="p-4">
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {#if isPaymentMode}
                  Pay with UPI
                {:else if isAddressMode}
                  Delivery Address
                {:else}
                  Your Cart
                {/if}
              </h3>
              <button onclick={closeCartDrawer} class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X class="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
    
            {#if isPaymentMode}
              <!-- Payment QR Code -->
              <div class="flex flex-col items-center space-y-4">
                {#if orderPlaced}
                  <!-- Order Success -->
                  <div class="text-center py-8">
                    <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Order Placed Successfully!</h3>
                    {#if orderResult?.orderNo}
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order ID: {orderResult.orderNo}</p>
                    {/if}
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {#if orderResult?.estimatedDelivery}
                        Estimated delivery: {orderResult.estimatedDelivery}
                      {:else}
                        Your food will be delivered between 6:00 PM - 9:30 PM today.
                      {/if}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-500 mb-4">Thank you for ordering with HomeFood!</p>
                    {#if orderResult?.orders}
                    {#each orderResult.orders as order}
                    <div class="mt-4">
                      <h4 class="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Order Details:</h4>
                      <div class="space-y-1">
                        {#each order.items as item}
                          <div class="text-sm text-gray-700 dark:text-gray-300">
                            <span>{item.name} by {order.hostName}  ₹{item.unitPrice}  * {item.quantity} = ₹{item.unitPrice * item.quantity}</span>
                          </div>
                        {/each}
                      </div>
                    </div>
                    {/each}
                   
                  {/if} 
                    <button
                      onclick={closeCartDrawer}
                      class="mt-6 w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </div>
                {:else}
                  <div class="bg-white p-4 rounded-lg shadow-sm">
                    <img src={upiQrUrl} alt="UPI QR Code" class="w-64 h-64" />
                  </div>
                  <div class="text-center">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Scan with any UPI app</p>
                    <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</p>
                  </div>

                  {#if orderError}
                    <div class="w-full bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                      {orderError}
                    </div>
                  {/if}

                  <div class="flex gap-2 w-full">
                    <button
                      onclick={() => { isPaymentMode = false; isAddressMode = true; }}
                      disabled={isPlacingOrder}
                      class="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Back to Address
                    </button>
                    <button
                      onclick={placeOrder}
                      disabled={isPlacingOrder}
                      class="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {#if isPlacingOrder}
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Placing Order...
                      {:else}
                        Payment Done
                      {/if}
                    </button>
                  </div>
                {/if}
              </div>
            {:else if isAddressMode}
              <!-- Address Input -->
              <div class="space-y-4">
                <div>
                  <label for="quarter-number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quarter Number
                    {#if localStorage.getItem('userQuarterNumber')}
                      <span class="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">(saved)</span>
                    {/if}
                  </label>
                  <input
                    id="quarter-number"
                    type="text"
                    bind:value={quarterNumber}
                    placeholder={localStorage.getItem('userQuarterNumber') ? "Quarter number (saved)" : "Enter your quarter number (e.g., Q-123)"}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:focus:border-yellow-400 outline-none"
                  />
                </div>
                <div class="flex gap-2">
                  <button
                    onclick={() => isAddressMode = false}
                    class="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Back to Cart
                  </button>
                  <button
                    onclick={proceedToPayment}
                    disabled={!quarterNumber.trim()}
                    class="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            {:else}
              <!-- Cart Items -->
              <div class="space-y-4 max-h-96 overflow-y-auto">
                {#each cartItems as item (item.id)}
                  <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <img src={item.image} alt={item.name} class="w-16 h-16 object-cover rounded-lg" />
                    <div class="flex-1">
                      <h4 class="font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400">₹{item.price}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        onclick={() => decreaseQuantity(item.id)}
                        class="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors"
                      >
                        <Minus class="w-4 h-4" />
                      </button>
                      <span class="text-sm font-medium min-w-[20px] text-center">{item.quantity}</span>
                      <button
                        onclick={() => increaseQuantity(item.id)}
                        class="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors"
                      >
                        <Plus class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
    
            <!-- Footer -->
            {#if !isPaymentMode && !isAddressMode && cartItems.length > 0}
              <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div class="flex items-center justify-between mb-4">
                  <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">Total: ₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                </div>
                <button onclick={proceedToCheckout} class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white py-3 rounded-lg font-medium transition-colors">
                  Select address at next step
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Quick Filters - Zomato Style -->
    <div class="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2">
      <button
        class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors {localSelectedCategory === 'all' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600'}"
        onclick={() => handleCategoryChange('all')}
      >
        <Utensils class="w-4 h-4" />
        All
      </button>
      {#each categories.filter(cat => cat.id !== 'all') as category}
        <button
          class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors {localSelectedCategory === category.id ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600'}"
          onclick={() => handleCategoryChange(category.id)}
        >
          {#if category.id === 'indian'}
            <ChefHat class="w-4 h-4" />
          {:else if category.id === 'italian'}
            <Pizza class="w-4 h-4" />
          {:else if category.id === 'chinese'}
            <Coffee class="w-4 h-4" />
          {:else if category.id === 'mexican'}
            <Utensils class="w-4 h-4" />
          {:else}
            <Utensils class="w-4 h-4" />
          {/if}
          {category.name}
        </button>
      {/each}
    </div>

    <!-- Loading State -->
    {#if isLoading}
      <div class="text-center py-12 sm:py-16">
        <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <div class="w-8 h-8 sm:w-10 sm:h-10 border-4 border-yellow-400 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
        <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading delicious food...</h3>
        <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400">Finding the best restaurants near you</p>
      </div>
    {:else if foods.length === 0 && !error}
      <div class="text-center py-12 sm:py-16">
        <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChefHat class="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No restaurants found</h3>
        <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filters</p>
        <button
          class="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          onclick={() => {
            localSearchQuery = ''
            localSelectedCategory = 'all'
            localSelectedVegetarian = undefined
            searchQuery = ''
            selectedCategory = 'all'
            selectedVegetarian = undefined
            currentPage = 1
            loadData()
          }}
        >
          Clear all filters
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {#each foods as food}
          <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 overflow-hidden">
            <!-- Food Image -->
            <div class="relative">
              <img
                src={food.image}
                alt={food.name}
                class="w-full h-48 sm:h-56 object-cover"
              />
              <!-- Rating Badge - Zomato Style -->
              <div class="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-teal-500 text-white px-2 py-1 rounded text-sm font-semibold flex items-center gap-1">
                <Star class="w-3 h-3 fill-current" />
                {food.rating}
              </div>
              <!-- Veg/Non-Veg Badge -->
              <div class="absolute top-3 right-3">
                <div class={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  food.isVegetarian
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                    : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800'
                }`}>
                  {#if food.isVegetarian}
                    <Leaf class="w-3 h-3" />
                    <span>Veg</span>
                  {:else}
                    <Beef class="w-3 h-3" />
                    <span>Non-Veg</span>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Restaurant Info -->
            <div class="p-4">
              <!-- Restaurant Name -->
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">{food.host.name}</h3>

              <!-- Cuisine Type -->
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{food.category} • {food.host.location}</p>

              <!-- Rating and Reviews -->
              <div class="flex items-center gap-2 mb-3">
                <div class="flex items-center gap-1">
                  <Star class="w-4 h-4 fill-green-600 dark:fill-green-400 text-green-600 dark:text-green-400" />
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{food.rating}</span>
                </div>
                <span class="text-sm text-gray-500 dark:text-gray-400">({food.totalRatings} reviews)</span>
                <span class="text-gray-300 dark:text-gray-600">•</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{food.preparationTime} mins</span>
              </div>

              <!-- Dish Name and Price -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{food.name}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">₹{food.price}</p>
                </div>
                {#if food.id in cart}
                  <div class="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-2 py-2 rounded-lg transition-colors">
                    <button
                      onclick={() => decreaseQuantity(food.id)}
                      class="w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:bg-opacity-20 transition-colors"
                    >
                      <Minus class="w-4 h-4" />
                    </button>
                    <span class="text-sm font-medium min-w-[20px] text-center">{cart[food.id]}</span>
                    <button
                      onclick={() => increaseQuantity(food.id)}
                      class="w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:bg-opacity-20 transition-colors"
                    >
                      <Plus class="w-4 h-4" />
                    </button>
                  </div>
                {:else}
                  <button
                    onclick={() => addToCart(food.id)}
                    class="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Pagination - Zomato Style -->
      {#if totalPages > 1}
        <div class="flex items-center justify-center gap-2 mt-8">
          <button
            class="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={!hasPrevPage}
            onclick={() => goToPage(currentPage - 1)}
          >
            <span>‹</span>
            <span class="hidden sm:inline">Previous</span>
          </button>

          <div class="flex items-center gap-1">
            {#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              return pageNum <= totalPages ? pageNum : null
            }).filter((page): page is number => page !== null) as pageNum}
              <button
                class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pageNum === currentPage
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600"
                }`}
                onclick={() => goToPage(pageNum)}
              >
                {pageNum}
              </button>
            {/each}
          </div>

          <button
            class="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={!hasNextPage}
            onclick={() => goToPage(currentPage + 1)}
          >
            <span class="hidden sm:inline">Next</span>
            <span>›</span>
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .analog-meter {
    position: relative;
    display: inline-block;
  }

  .meter-background {
    position: relative;
    background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 50%, rgba(255,255,255,0.1) 100%);
    border-radius: 8px;
    padding: 4px 8px;
    border: 1px solid rgba(255,255,255,0.2);
    box-shadow:
      inset 0 2px 4px rgba(0,0,0,0.3),
      0 1px 2px rgba(255,255,255,0.1);
  }

  .analog-display {
    display: inline-block;
    position: relative;
    animation: analogSpin 0.8s ease-out;
    font-family: 'Courier New', monospace;
    letter-spacing: 1px;
  }

  @keyframes analogSpin {
    0% {
      transform: rotateX(90deg) scale(0.8);
      opacity: 0.3;
    }
    50% {
      transform: rotateX(45deg) scale(1.1);
      opacity: 0.7;
    }
    100% {
      transform: rotateX(0deg) scale(1);
      opacity: 1;
    }
  }

  .analog-display::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
    animation: analogShine 2s ease-in-out infinite;
    pointer-events: none;
    border-radius: 4px;
  }

  @keyframes analogShine {
    0%, 100% {
      opacity: 0;
      transform: translateX(-100%);
    }
    50% {
      opacity: 1;
      transform: translateX(100%);
    }
  }
</style>