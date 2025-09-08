<script lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Button } from '$lib/components/ui/button'
import { Badge } from '$lib/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
import { Plus, ChefHat, ShoppingCart, Star, TrendingUp, Users, X } from '@lucide/svelte'
import { toast } from 'svelte-sonner'
import { onMount } from 'svelte'
import { goto } from '$app/navigation'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

let { data }: Props = $props()

// Client-side reactive state initialized with server data
let hostStats = $state(data.hostStats)
let myFoods = $state(data.myFoods)
let recentOrders = $state(data.recentOrders)
let applicationStatus = $state(data.applicationStatus || null)
let isLoading = $state(false)
let currentTab = $state('foods')

// Modal state
let isAddFoodModalOpen = $state(false)
let isEditFoodModalOpen = $state(false)
let isApplicationModalOpen = $state(false)
let isSubmitting = $state(false)
let submitError = $state('')

// Form data
let newFood = $state({
  name: '',
  description: '',
  price: '',
  categoryId: '',
  isVegetarian: false,
  preparationTime: 30,
  image: null as File | null,
})

let editingFood = $state({
  id: '',
  name: '',
  description: '',
  price: '',
  categoryId: '',
  isVegetarian: false,
  preparationTime: 30,
  image: null as File | null,
})

// Application form data
let applicationForm = $state({
  businessName: '',
})

// Image preview
let imagePreview = $state('')

// Categories
let categories = $state<Array<{ id: string; name: string; slug: string }>>([])

// Update state when server data changes
$effect(() => {
  hostStats = data.hostStats
  myFoods = data.myFoods
  recentOrders = data.recentOrders
})

// Load categories on component mount
onMount(() => {
  loadCategories()
  // Fetch host data if on foods tab and no initial data
  if (currentTab === 'foods' && myFoods.length === 0) {
    fetchHostData()
  }
})

// API fetch functions
async function fetchHostData() {
  try {
    isLoading = true

    // Fetch foods
    const foodsResponse = await fetch(`/api/foods/my`)
    if (foodsResponse.ok) {
      const foodsData = await foodsResponse.json()
      myFoods = foodsData.map((food: any) => ({
        id: food.id,
        name: food.name,
        description: food.description,
        price: parseFloat(food.price),
        image: food.image,
        categoryId: food.categoryId,
        isVegetarian: food.isVegetarian,
        preparationTime: food.preparationTime || 30,
        status: food.isAvailable ? 'available' : 'unavailable',
        orders: Math.floor(Math.random() * 20), // TODO: Calculate from actual order data
        rating: food.rating ? parseFloat(food.rating) : 0,
      }))
    }

    // Recalculate stats based on fetched foods
    const totalFoods = myFoods.filter((food: any) => food.status === 'available').length
    const activeOrders = recentOrders.filter(
      (order: any) => order.status && ['preparing', 'ready'].includes(order.status)
    ).length
    const totalOrders = recentOrders.length
    const averageRating =
      myFoods.length > 0
        ? myFoods.reduce((sum: number, food: any) => sum + (food.rating || 0), 0) / myFoods.length
        : 0
    const totalEarnings = recentOrders.reduce(
      (sum: number, order: any) => sum + order.totalAmount,
      0
    )

    hostStats = {
      totalFoods,
      activeOrders,
      totalOrders,
      averageRating: Math.round(averageRating * 10) / 10,
      totalEarnings,
    }
  } catch (error) {
    console.error('Error fetching host data:', error)
  } finally {
    isLoading = false
  }
}

async function fetchOrdersData() {
  try {
    isLoading = true

    // Fetch orders
    const ordersResponse = await fetch(`/api/orders/my`)
    if (ordersResponse.ok) {
      recentOrders = await ordersResponse.json()
    }

    // Recalculate stats based on fetched orders
    const activeOrders = recentOrders.filter(
      (order: any) => order.status && ['preparing', 'ready'].includes(order.status)
    ).length
    const totalOrders = recentOrders.length
    const totalEarnings = recentOrders.reduce(
      (sum: number, order: any) => sum + order.totalAmount,
      0
    )

    hostStats = {
      ...hostStats,
      activeOrders,
      totalOrders,
      totalEarnings,
    }
  } catch (error) {
    console.error('Error fetching orders data:', error)
  } finally {
    isLoading = false
  }
}

async function fetchAnalyticsData() {
  try {
    isLoading = true

    // Fetch analytics/stats
    const analyticsResponse = await fetch(`/api/orders/my/analytics`)
    if (analyticsResponse.ok) {
      hostStats = await analyticsResponse.json()
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
  } finally {
    isLoading = false
  }
}

// Tab change handler
function handleTabChange(value: string) {
  currentTab = value
  if (value === 'foods') {
    fetchHostData()
  } else if (value === 'orders') {
    fetchOrdersData()
  } else if (value === 'analytics') {
    fetchAnalyticsData()
  }
}

// Image handling functions
function handleImageSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      submitError = 'Please select a valid image file'
      scrollToFieldAndFocus('food-image')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      submitError = 'Image size must be less than 5MB'
      scrollToFieldAndFocus('food-image')
      return
    }

    newFood.image = file
    submitError = ''

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function removeImage() {
  newFood.image = null
  imagePreview = ''
  // Reset file input
  const fileInput = document.getElementById('food-image') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

function handleEditImageSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      submitError = 'Please select a valid image file'
      scrollToFieldAndFocus('edit-food-image')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      submitError = 'Image size must be less than 5MB'
      scrollToFieldAndFocus('edit-food-image')
      return
    }

    editingFood.image = file
    submitError = ''

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function removeEditImage() {
  editingFood.image = null
  imagePreview = ''
  // Reset file input
  const fileInput = document.getElementById('edit-food-image') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

// Scroll to specific field and focus it
function scrollToFieldAndFocus(fieldId: string) {
  // Handle both regular and edit modal field IDs
  let actualFieldId = fieldId
  if (fieldId.startsWith('edit-')) {
    // For edit modal, the field ID is already correct
    actualFieldId = fieldId
  } else if (isEditFoodModalOpen) {
    // If we're in edit modal but fieldId doesn't start with 'edit-', add it
    actualFieldId = `edit-${fieldId}`
  }

  const field = document.getElementById(actualFieldId)
  if (field) {
    // Scroll the field into view
    field.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    // Focus the field after a short delay to ensure scrolling is complete
    setTimeout(() => {
      field.focus()
      // If it's a text input, select all text
      if (field instanceof HTMLInputElement && field.type === 'text') {
        field.select()
      }
    }, 500)
  }
}

// Modal functions
function openAddFoodModal() {
  isAddFoodModalOpen = true
  submitError = ''
  // Reset form
  newFood = {
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isVegetarian: false,
    preparationTime: 30,
    image: null,
  }
  imagePreview = ''
}

function closeAddFoodModal() {
  isAddFoodModalOpen = false
  submitError = ''
}

function openEditFoodModal(food: any) {
  isEditFoodModalOpen = true
  submitError = ''

  // Find the category slug from the UUID
  let categorySlug = ''
  if (food.categoryId && categories.length > 0) {
    const category = categories.find((cat) => cat.id === food.categoryId)
    categorySlug = category ? category.slug : ''
  }

  editingFood = {
    id: food.id,
    name: food.name,
    description: food.description || '',
    price: food.price.toString(),
    categoryId: categorySlug,
    isVegetarian: food.isVegetarian || false,
    preparationTime: food.preparationTime || 30,
    image: null,
  }
  imagePreview = food.image || ''
}

function closeEditFoodModal() {
  isEditFoodModalOpen = false
  submitError = ''
}

// Application modal functions
function openApplicationModal() {
  isApplicationModalOpen = true
  submitError = ''
  // Reset form
  applicationForm = {
    businessName: '',
  }
}

function closeApplicationModal() {
  isApplicationModalOpen = false
  submitError = ''
}

// Load categories from API
async function loadCategories() {
  try {
    const response = await fetch('/api/foods/categories')
    if (response.ok) {
      const data = await response.json()
      // Filter out the "All Categories" option and keep only actual categories
      categories = data.filter((cat: any) => cat.id !== 'all')
    }
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

// Submit new food
async function submitNewFood() {
  // Check for missing required fields and scroll to first missing one
  if (!newFood.name.trim()) {
    submitError = 'Please enter a food name'
    scrollToFieldAndFocus('food-name')
    return
  }

  if (!newFood.price) {
    submitError = 'Please enter a price'
    scrollToFieldAndFocus('food-price')
    return
  }

  isSubmitting = true
  submitError = ''

  // Test API connectivity first
  try {
    const testResponse = await fetch('/api/foods/categories')
    if (!testResponse.ok) {
      throw new Error('API is not responding')
    }
  } catch (apiTestError) {
    console.warn('API test failed:', apiTestError)
    // Continue with demo mode
  }

  try {
    // For now, we'll handle the image as a base64 string or URL
    // In a real implementation, you'd upload the file to a storage service first
    let imageUrl = '/api/placeholder/300/200' // Default placeholder

    if (newFood.image) {
      // Convert image to base64 for demo purposes
      // In production, you'd upload to cloud storage and get a URL
      imageUrl = imagePreview
    }

    const foodData = {
      name: newFood.name.trim(),
      description: newFood.description.trim(),
      price: parseFloat(newFood.price),
      categoryId: newFood.categoryId,
      isVegetarian: newFood.isVegetarian,
      preparationTime: newFood.preparationTime,
      image: imageUrl,
    }

    console.log('Sending food data:', foodData)

    let response
    try {
      response = await fetch('/api/foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(foodData),
      })
      console.log('API Response status:', response.status)
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      // If API is not available, simulate success for demo purposes
      console.warn('API not available, simulating successful food creation')

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Success - close modal
      closeAddFoodModal()
      toast.success(
        `Food item "${newFood.name}" added successfully! (Demo mode - Database not connected)`
      )
      return
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        console.log('Error response data:', errorData)
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch (parseError) {
        // If we can't parse the error response, use the HTTP status
        console.error('Failed to parse error response:', parseError)
      }
      throw new Error(errorMessage)
    }

    // Success - close modal and refresh data
    closeAddFoodModal()

    // TODO: Refresh the foods list or navigate to reload the page
    // For now, we'll just close the modal
    toast.success('Food item added successfully!')
  } catch (error) {
    console.error('Error adding food:', error)
    submitError = error instanceof Error ? error.message : 'Failed to add food item'

    // Scroll to top to show error message for API errors
    const modalContent = document.querySelector('.modal-content')
    if (modalContent) {
      modalContent.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  } finally {
    isSubmitting = false
  }
}

// Submit edited food
async function submitEditFood() {
  // Check for missing required fields and scroll to first missing one
  if (!editingFood.name.trim()) {
    submitError = 'Please enter a food name'
    scrollToFieldAndFocus('edit-food-name')
    return
  }

  if (!editingFood.price) {
    submitError = 'Please enter a price'
    scrollToFieldAndFocus('edit-food-price')
    return
  }

  isSubmitting = true
  submitError = ''

  try {
    // Handle image
    let imageUrl = imagePreview || '/api/placeholder/300/200'
    if (editingFood.image) {
      imageUrl = imagePreview
    }

    const foodData = {
      name: editingFood.name.trim(),
      description: editingFood.description.trim(),
      price: parseFloat(editingFood.price),
      categoryId: editingFood.categoryId,
      isVegetarian: editingFood.isVegetarian,
      preparationTime: editingFood.preparationTime,
      image: imageUrl,
    }

    const response = await fetch(`/api/foods/${editingFood.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(foodData),
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError)
      }
      throw new Error(errorMessage)
    }

    // Success - close modal and refresh data
    closeEditFoodModal()
    toast.success('Food item updated successfully!')

    // TODO: Refresh the foods list
    window.location.reload()
  } catch (error) {
    console.error('Error updating food:', error)
    submitError = error instanceof Error ? error.message : 'Failed to update food item'
  } finally {
    isSubmitting = false
  }
}

// Submit application
async function submitApplication() {
  if (!applicationForm.businessName.trim()) {
    submitError = 'Please enter a business name'
    return
  }

  isSubmitting = true
  submitError = ''

  try {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: applicationForm.businessName.trim(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    toast.success('Application submitted successfully!')

    // Close modal and refresh page to show new status
    closeApplicationModal()
    window.location.reload()
  } catch (error) {
    console.error('Error submitting application:', error)
    submitError = error instanceof Error ? error.message : 'Failed to submit application'
  } finally {
    isSubmitting = false
  }
}

// Toggle food availability
async function toggleFoodAvailability(foodId: string, currentStatus: boolean) {
  try {
    const response = await fetch(`/api/foods/${foodId}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isAvailable: !currentStatus,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    toast.success(`Food item ${!currentStatus ? 'enabled' : 'disabled'} successfully!`)

    // TODO: Refresh the foods list
    window.location.reload()
  } catch (error) {
    console.error('Error toggling food availability:', error)
    toast.error('Failed to update food availability')
  }
}
</script>

<svelte:head>
  <title>Chef Dashboard - HomeFood</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4 py-6">
    <!-- Application Status Banner -->
    {#if applicationStatus}
      {#if applicationStatus.status === 'pending' || applicationStatus.status === 'approved' || applicationStatus.status === 'rejected'}
        <div class="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-green-800 dark:text-green-200">Application Received</h3>
              <p class="text-green-700 dark:text-green-300">
                We have received your application. You will receive a notification once it is approved. Your items will be available to order after approval.
              </p>
              <p class="text-sm text-green-600 dark:text-green-400 mt-1">
                Applied on {new Date(applicationStatus.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      {:else if applicationStatus.status === 'rejected'}
        <div class="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-red-800 dark:text-red-200">Application Rejected</h3>
              <p class="text-red-700 dark:text-red-300">
                Unfortunately, your application was not approved at this time.
                {#if applicationStatus.reviewNotes}
                  Reason: {applicationStatus.reviewNotes}
                {/if}
              </p>
              <p class="text-sm text-red-600 dark:text-red-400 mt-1">
                Reviewed on {new Date(applicationStatus.reviewedAt).toLocaleDateString()}
              </p>
            </div>
            <Button onclick={() => goto('/host/apply')} class="bg-red-600 hover:bg-red-700 text-white">
              Reapply
            </Button>
          </div>
        </div>
      {/if}
    {/if}

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Chef Dashboard</h1>
        <p class="text-gray-600 dark:text-gray-400">Manage your culinary business</p>
        {#if myFoods.length > 0 && myFoods.some((f: any) => f.id?.startsWith('demo-'))}
          <span class="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
            Demo Mode - Data saved locally
          </span>
        {/if}
      </div>
      {#if applicationStatus?.status === 'approved'}
        <Button onclick={openAddFoodModal}>
          <Plus class="w-4 h-4 mr-2" />
          Add New Food
        </Button>
      {/if}
    </div>


    <!-- Main Content -->
    <Tabs value={currentTab} onValueChange={handleTabChange} class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="foods">My Foods ({hostStats.totalFoods})</TabsTrigger>
        <TabsTrigger value="orders">Orders ({hostStats.totalOrders})</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      {#if isLoading}
        <div class="flex items-center justify-center py-8">
          <div class="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      {/if}

      <TabsContent value="foods" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">My Food Items</h2>
          <Button variant="outline" onclick={openAddFoodModal}>
            <Plus class="w-4 h-4 mr-2" />
            Add Food
          </Button>
        </div>

        {#if myFoods.length === 0}
          <!-- Onboarding Content for Empty State -->
          <div class="text-center py-12 px-6">
            <div class="max-w-md mx-auto">
              <div class="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChefHat class="w-12 h-12 text-orange-600 dark:text-orange-400" />
              </div>

              <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Start Your Culinary Journey
              </h3>

              <p class="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Share your homemade delicacies with food lovers in your area. Add your first dish and start earning from your passion for cooking!
              </p>

              <div class="space-y-4 mb-8">
                <div class="flex items-center justify-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Set your own prices</span>
                </div>
                <div class="flex items-center justify-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Reach local customers</span>
                </div>
                <div class="flex items-center justify-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Build your food business</span>
                </div>
              </div>

              <Button class="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus class="w-5 h-5 mr-2" />
                Add Your First Dish
              </Button>

              <p class="text-xs text-gray-500 dark:text-gray-500 mt-4">
                Takes less than 2 minutes to get started
              </p>
            </div>
          </div>
        {:else}
          <!-- Active Foods Section -->
          {#if myFoods.filter(f => f.status === 'available').length > 0}
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-4 mb-6 border border-green-200 dark:border-green-800">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-green-800 dark:text-green-200">Active Foods</h3>
                  <p class="text-sm text-green-600 dark:text-green-400">These dishes are live and available for orders</p>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each myFoods.filter(f => f.status === 'available') as food}
                  <Card class="border-green-200 dark:border-green-800 shadow-md overflow-hidden">
                    <!-- Food Image -->
                    {#if food.image}
                      <div class="relative h-32 overflow-hidden">
                        <img
                          src={food.image}
                          alt={food.name}
                          class="w-full h-full object-cover"
                        />
                        <div class="absolute top-2 right-2">
                          <Badge variant="default" class="bg-green-500 hover:bg-green-600">
                            Available
                          </Badge>
                        </div>
                      </div>
                    {/if}
                    <CardHeader>
                      <div class="flex items-center justify-between">
                        <CardTitle class="text-lg">{food.name}</CardTitle>
                        {#if !food.image}
                          <Badge variant="default" class="bg-green-500 hover:bg-green-600">
                            Available
                          </Badge>
                        {/if}
                      </div>
                      <CardDescription>₹{food.price}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span>{food.orders} orders</span>
                        <div class="flex items-center">
                          <Star class="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span>{food.rating}</span>
                        </div>
                      </div>
                      <div class="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          class="flex-1"
                          onclick={() => openEditFoodModal(food)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          class="flex-1"
                          onclick={() => toggleFoodAvailability(food.id, true)}
                        >
                          Disable
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Inactive Foods Section -->
          {#if myFoods.filter(f => f.status === 'unavailable').length > 0}
            <div class="mb-6">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Inactive Foods</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">These dishes are currently disabled</p>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each myFoods.filter(f => f.status === 'unavailable') as food}
                  <Card class="opacity-75 overflow-hidden">
                    <!-- Food Image -->
                    {#if food.image}
                      <div class="relative h-32 overflow-hidden opacity-60">
                        <img
                          src={food.image}
                          alt={food.name}
                          class="w-full h-full object-cover grayscale"
                        />
                        <div class="absolute top-2 right-2">
                          <Badge variant="secondary">
                            Unavailable
                          </Badge>
                        </div>
                      </div>
                    {/if}
                    <CardHeader>
                      <div class="flex items-center justify-between">
                        <CardTitle class="text-lg">{food.name}</CardTitle>
                        {#if !food.image}
                          <Badge variant="secondary">
                            Unavailable
                          </Badge>
                        {/if}
                      </div>
                      <CardDescription>₹{food.price}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span>{food.orders} orders</span>
                        <div class="flex items-center">
                          <Star class="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span>{food.rating}</span>
                        </div>
                      </div>
                      <div class="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          class="flex-1"
                          onclick={() => openEditFoodModal(food)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          class="flex-1"
                          onclick={() => toggleFoodAvailability(food.id, false)}
                        >
                          Enable
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                {/each}
              </div>
            </div>
          {/if}
        {/if}
      </TabsContent>

      <TabsContent value="orders" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h2>
          <Button variant="outline">View All Orders</Button>
        </div>

        {#if recentOrders.length === 0}
          <!-- Onboarding Content for Empty Orders -->
          <div class="text-center py-12 px-6">
            <div class="max-w-md mx-auto">
              <div class="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart class="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>

              <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Orders Will Flow In Soon
              </h3>

              <p class="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Once you add your delicious dishes and make them available, hungry customers in your area will start placing orders. Get ready to serve!
              </p>

              <div class="space-y-4 mb-8">
                <div class="flex items-center justify-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time order notifications</span>
                </div>
                <div class="flex items-center justify-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Direct customer communication</span>
                </div>
                <div class="flex items-center justify-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Easy order management</span>
                </div>
              </div>

              {#if myFoods.length === 0}
                <Button class="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus class="w-5 h-5 mr-2" />
                  Add Your First Dish
                </Button>

                <p class="text-xs text-gray-500 dark:text-gray-500 mt-4">
                  Add dishes first, then watch orders come in!
                </p>
              {:else}
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4 mb-6">
                  <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span class="font-semibold">💡 Tip:</span> Make sure your dishes are set to "Available" to start receiving orders
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    You have {myFoods.filter((f: any) => f.status === 'available').length} available dish(es) out of {myFoods.length} total
                  </p>
                </div>

                <Button variant="outline" class="px-6 py-2">
                  Check Dish Availability
                </Button>
              {/if}
          
              <!-- Edit Food Modal -->
            </div>
          </div>
        {:else}
          <!-- Orders List -->
          <div class="space-y-4">
            {#each recentOrders as order}
              <Card>
                <CardContent class="pt-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="font-semibold text-gray-900 dark:text-gray-100">{order.customerName}</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{order.foodName} × {order.quantity}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-500">{order.orderTime}</p>
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
                    <!-- <Button size="sm" variant="outline">View Details</Button> -->
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
        {/if}
      </TabsContent>

      <TabsContent value="analytics" class="space-y-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Analytics & Statistics</h2>

        <!-- Key Metrics - Sleek Design -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="flex items-center justify-center mb-2">
                <ChefHat class="h-5 w-5 text-blue-600 mr-2" />
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Total Foods</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 dark:text-gray-100">{hostStats.totalFoods}</div>
            </div>

            <div class="text-center">
              <div class="flex items-center justify-center mb-2">
                <ShoppingCart class="h-5 w-5 text-green-600 mr-2" />
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Active Orders</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 dark:text-gray-100">{hostStats.activeOrders}</div>
            </div>

            <div class="text-center">
              <div class="flex items-center justify-center mb-2">
                <TrendingUp class="h-5 w-5 text-purple-600 mr-2" />
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Total Earnings</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 dark:text-gray-100">₹{hostStats.totalEarnings}</div>
            </div>
          </div>
        </div>

        <!-- Detailed Analytics -->
        <!-- <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-3xl font-bold text-green-600 dark:text-green-400">₹8,500</div>
              <p class="text-sm text-gray-600 dark:text-gray-400">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Satisfaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-3xl font-bold text-gray-900 dark:text-gray-100">{hostStats.averageRating}</div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Average rating from {hostStats.totalOrders} orders</p>
            </CardContent>
          </Card>
        </div> -->

        <!-- Performance Insights -->
        <!-- <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Order Completion Rate</span>
              <span class="text-sm text-gray-600 dark:text-gray-400">95%</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Average Order Value</span>
              <span class="text-sm text-gray-600 dark:text-gray-400">₹{hostStats.totalOrders > 0 ? Math.round(hostStats.totalEarnings / hostStats.totalOrders) : 0}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Active Food Items</span>
              <span class="text-sm text-gray-600 dark:text-gray-400">{myFoods.filter(f => f.status === 'available').length} of {myFoods.length}</span>
            </div>
          </CardContent>
        </Card> -->
      </TabsContent>
    </Tabs>

    <!-- Add Food Modal -->
    {#if isAddFoodModalOpen}
      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Food Item</h3>
            <button
              onclick={closeAddFoodModal}
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X class="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-4">
            {#if submitError}
              <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {submitError}
              </div>
            {/if}

            <div>
              <label for="food-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Food Name *
              </label>
              <input
                id="food-name"
                type="text"
                bind:value={newFood.name}
                placeholder="e.g., Butter Chicken"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 outline-none"
                required
              />
            </div>

            <div>
              <label for="food-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="food-description"
                bind:value={newFood.description}
                placeholder="Describe your delicious dish..."
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 outline-none resize-none"
              ></textarea>
            </div>

            <div>
              <label for="food-image" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Food Image
              </label>

              {#if imagePreview}
                <!-- Image Preview -->
                <div class="relative mb-3">
                  <img
                    src={imagePreview}
                    alt="Food preview"
                    class="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onclick={removeEditImage}
                    class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              {/if}

              <!-- File Input -->
              <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-orange-400 dark:hover:border-orange-400 transition-colors">
                <input
                  id="food-image"
                  type="file"
                  accept="image/*"
                  onchange={handleImageSelect}
                  class="hidden"
                />
                <label for="food-image" class="cursor-pointer">
                  <div class="flex flex-col items-center">
                    {#if !imagePreview}
                      <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                        <svg class="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      </div>
                    {/if}
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {imagePreview ? 'Change Image' : 'Click to upload image'}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PNG, JPG up to 5MB
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="food-price" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (₹) *
                </label>
                <input
                  id="food-price"
                  type="number"
                  bind:value={newFood.price}
                  placeholder="250"
                  min="1"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 outline-none"
                  required
                />
              </div>

              <div>
                <label for="prep-time" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prep Time (mins)
                </label>
                <input
                  id="prep-time"
                  type="number"
                  bind:value={newFood.preparationTime}
                  placeholder="30"
                  min="5"
                  max="240"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label for="food-category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                id="food-category"
                bind:value={newFood.categoryId}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 outline-none"
              >
                <option value="">Select a category (optional)</option>
                {#each categories as category}
                  <option value={category.slug}>{category.name}</option>
                {/each}
              </select>
            </div>

            <div class="flex items-center">
              <input
                id="is-vegetarian"
                type="checkbox"
                bind:checked={newFood.isVegetarian}
                class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label for="is-vegetarian" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                This is a vegetarian dish
              </label>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onclick={closeAddFoodModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onclick={submitNewFood}
              disabled={isSubmitting}
              class="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
            >
              {#if isSubmitting}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Adding...
              {:else}
                <Plus class="w-4 h-4 mr-2" />
                Add Food Item
              {/if}
            </Button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Edit Food Modal -->
    {#if isEditFoodModalOpen}
      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Food Item</h3>
            <button
              onclick={closeEditFoodModal}
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X class="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-4">
            {#if submitError}
              <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {submitError}
              </div>
            {/if}

            <div>
              <label for="edit-food-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Food Name *
              </label>
              <input
                id="edit-food-name"
                type="text"
                bind:value={editingFood.name}
                placeholder="e.g., Butter Chicken"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 outline-none"
                required
              />
            </div>

            <div>
              <label for="edit-food-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="edit-food-description"
                bind:value={editingFood.description}
                placeholder="Describe your delicious dish..."
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 outline-none resize-none"
              ></textarea>
            </div>

            <div>
              <label for="edit-food-image" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Food Image
              </label>

              {#if imagePreview}
                <!-- Image Preview -->
                <div class="relative mb-3">
                  <img
                    src={imagePreview}
                    alt="Food preview"
                    class="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onclick={removeImage}
                    class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              {/if}

              <!-- File Input -->
              <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-orange-400 dark:hover:border-orange-400 transition-colors">
                <input
                  id="edit-food-image"
                  type="file"
                  accept="image/*"
                  onchange={handleEditImageSelect}
                  class="hidden"
                />
                <label for="edit-food-image" class="cursor-pointer">
                  <div class="flex flex-col items-center">
                    {#if !imagePreview}
                      <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                        <svg class="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      </div>
                    {/if}
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {imagePreview ? 'Change Image' : 'Click to upload image'}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PNG, JPG up to 5MB
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="edit-food-price" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (₹) *
                </label>
                <input
                  id="edit-food-price"
                  type="number"
                  bind:value={editingFood.price}
                  placeholder="250"
                  min="1"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 outline-none"
                  required
                />
              </div>

              <div>
                <label for="edit-prep-time" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prep Time (mins)
                </label>
                <input
                  id="edit-prep-time"
                  type="number"
                  bind:value={editingFood.preparationTime}
                  placeholder="30"
                  min="5"
                  max="240"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label for="edit-food-category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                id="edit-food-category"
                bind:value={editingFood.categoryId}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 dark:focus:border-orange-400 outline-none"
              >
                <option value="">Select a category (optional)</option>
                {#each categories as category}
                  <option value={category.slug}>{category.name}</option>
                {/each}
              </select>
            </div>

            <div class="flex items-center">
              <input
                id="edit-is-vegetarian"
                type="checkbox"
                bind:checked={editingFood.isVegetarian}
                class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label for="edit-is-vegetarian" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                This is a vegetarian dish
              </label>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onclick={closeEditFoodModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onclick={submitEditFood}
              disabled={isSubmitting}
              class="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
            >
              {#if isSubmitting}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Updating...
              {:else}
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Update Food Item
              {/if}
            </Button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Application Modal -->
    {#if isApplicationModalOpen}
      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Apply to Become a Chef</h3>
            <button
              onclick={closeApplicationModal}
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X class="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-4">
            {#if submitError}
              <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {submitError}
              </div>
            {/if}

            <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter your business name to start the application process. Our team will review your application and get back to you soon.
            </div>

            <div>
              <label for="business-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name *
              </label>
              <input
                id="business-name"
                type="text"
                bind:value={applicationForm.businessName}
                placeholder="e.g., John's Home Kitchen"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 outline-none"
                required
              />
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onclick={closeApplicationModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onclick={submitApplication}
              disabled={isSubmitting || !applicationForm.businessName.trim()}
              class="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {#if isSubmitting}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              {:else}
                Submit Application
              {/if}
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>