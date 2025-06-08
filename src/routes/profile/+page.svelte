<script lang="ts">
import { goto } from '$app/navigation'
import { apiService } from '$lib/services/api.service'
import { loginModal } from '$lib/stores/loginModal'
import { pointsStore } from '$lib/stores/pointsStore'
import { subscriptionStore } from '$lib/stores/subscriptionStore'
import { userStore } from '$lib/stores/userStore'
import { toast } from 'svelte-sonner'
import { onMount } from 'svelte'

// User data
let isLoading = $state(false)
let isEditMode = $state(false)
const userData = $state({
  name: '',
  phone: '',
  avatar: '',
})

// Photo upload
const selectedPhoto = $state(null)
const photoPreviewUrl = $state('')
const photoUploadProgress = $state(0)
const isUploading = $state(false)

// Achievements and points section
const points = $derived($pointsStore.totalPoints)
const level = $derived($pointsStore.level)
const goals = $derived($pointsStore.goals)
const isPointsLoading = $derived($pointsStore.isLoading)

// Subscription state
const hasSubscription = $derived($subscriptionStore?.hasActiveSubscription || false)
const subscription = $derived($subscriptionStore?.userSubscription)
const isSubscriptionLoading = $derived($subscriptionStore?.isLoading || false)

// Authentication state
const isAuthenticated = $derived($userStore?.user != null)

// Quiz history state
type QuizAttempt = {
  id: string
  quizTitle: string
  category?: string
  completedAt: string
  score: number
  timeSpent: number
}

let quizHistory = $state<QuizAttempt[]>([])

// Social sharing and avatar upload functions
function handleSocialShare(actionId: string) {
  // In a real app, this would open social sharing options
  // For demo purposes, we'll simulate successful sharing
  try {
    // Open a simple sharing dialog (browser native)
    if (navigator.share) {
      navigator
        .share({
          title: 'Check out my learning progress!',
          text: `I've reached Level ${level} with ${points} points on Learning Resource Platform!`,
          url: window.location.href,
        })
        .then(() => {
          // Complete the goal after successful sharing
          completeSpecialAction(actionId)
        })
        .catch((error) => {
          console.error('Error sharing:', error)
          // For demo purposes, we'll still complete the action
          completeSpecialAction(actionId)
        })
    } else {
      // Fallback for browsers that don't support the Web Share API
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I've reached Level ${level} with ${points} points on Learning Resource Platform! ${window.location.href}`)}`
      window.open(shareUrl, '_blank')
      completeSpecialAction(actionId)
    }
  } catch (error) {
    console.error('Error during social sharing:', error)
    // For demo purposes, we'll still complete the action
    completeSpecialAction(actionId)
  }
}

function handleAvatarUpload(actionId: string) {
  // Create a file input element
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  // Handle file selection
  input.onchange = (event) => {
    const file = event.target.files[0]
    if (file) {
      // In a real app, you would upload the file to your server
      // For demo purposes, we'll just show a toast and complete the action
      const reader = new FileReader()
      reader.onload = () => {
        // Set the avatar in the user data
        userData.avatar = reader.result

        // Show success message
        toast.success('Avatar uploaded successfully!')

        // Complete the action to earn points
        completeSpecialAction(actionId)
      }
      reader.readAsDataURL(file)
    }
  }

  // Trigger the file input click
  input.click()
}

function completeSpecialAction(actionId: string) {
  // Call the API service to complete the special action and earn points
  apiService.user
    .completeSpecialAction(actionId)
    .then((response) => {
      if (response.success) {
        // Update local points store to reflect changes
        pointsStore.loadUserPoints()
        toast.success('You earned points for completing this action!')
      } else {
        throw new Error(response.error || 'Failed to complete action')
      }
    })
    .catch((error) => {
      console.error('Error completing special action:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to earn points. Please try again.'
      )
    })
}

// Check authentication and redirect if not logged in using $effect for Svelte 5
$effect(() => {
  if (!$userStore?.user) {
    loginModal.open({
      redirectUrl: '/profile',
    })
    return
  }

  // Initialize user data from store
  userData.name = $userStore.user.name || ''
  userData.phone = $userStore.user.phone || ''
})

// Load data on mount
onMount(() => {
  // Load quiz history, points, and subscription info
  loadQuizHistory()
  pointsStore.loadUserPoints()
  subscriptionStore.checkSubscription()
})

// Load user's quiz history
async function loadQuizHistory() {
  isLoading = true
  try {
    const response = await apiService.user.getQuizHistory()
    if (response.success) {
      quizHistory = response.data?.attempts || []
    } else {
      toast.error('Failed to load quiz history')
    }
  } catch (error) {
    console.error('Error loading quiz history:', error)
    toast.error('An error occurred while loading your quiz history')
  } finally {
    isLoading = false
  }
}

// Toggle edit mode
function toggleEditMode() {
  isEditMode = !isEditMode

  // If canceling edit, restore original data
  if (!isEditMode && $userStore?.user) {
    userData.name = $userStore.user.name || ''
    userData.phone = $userStore.user.phone || ''
  }
}

// Complete a goal and earn points
async function completeGoal(goalId: string) {
  await pointsStore.completeGoal(goalId)
  toast.success('Goal completed! You earned points!')
}

// Format a date string
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Save profile changes
async function saveProfile() {
  if (!$userStore?.user) return

  isLoading = true
  try {
    // Use the API service to update the user data
    const response = await apiService.user.update(userData)

    if (response.success) {
      // Update the user store with the returned data or the input data
      const updatedUserData = response.data?.user || userData
      userStore.updateUser(updatedUserData)

      toast.success('Profile updated successfully')
      isEditMode = false
    } else {
      throw new Error(response.error || 'Failed to update profile')
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to update profile')
  } finally {
    isLoading = false
  }
}

// View a specific quiz result
function viewQuizResult(attemptId: string) {
  goto(`/quiz-results/${attemptId}`)
}

// Logout function
function logout() {
  // This should clear the user session
  $userStore.logout()
  goto('/')
}
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
  {#if !isAuthenticated}
    <div class="text-center py-12">
      <h1 class="text-2xl font-bold mb-4">Please Log In</h1>
      <p class="mb-6">You need to be logged in to view your profile.</p>
      <button 
        onclick={(e) => loginModal.open({ redirectUrl: '/profile' })}
        class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Log In
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Left Column - User Info -->
      <div class="md:col-span-1">
        <div class="bg-white rounded-lg shadow p-6 sticky top-24">
          <div class="flex flex-col items-center text-center mb-6">
            <div class="relative">
              <div class="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-transform duration-300 transform hover:scale-105">
                {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </div>
              {#if isAuthenticated}
                <div class="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white shadow-sm" title="Online"></div>
              {/if}
            </div>
            
            {#if !isEditMode}
              <h1 class="text-xl font-bold mt-4">{userData.name || 'User'}</h1>
              <p class="text-gray-600 mt-1">{userData.phone}</p>
            <button 
              onclick={(e) => toggleEditMode()}
              class="cursor-pointer view mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Edit Profile</span>
            </button>
              <!-- Points Display -->
              <div class="mt-4">
                <div class="bg-indigo-100 rounded-lg p-4 relative overflow-hidden">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-sm font-semibold text-indigo-900 uppercase tracking-wide">Level {level}</h3>
                      <div class="text-2xl font-bold text-indigo-700 mt-1">{points} Points</div>
                    </div>
                    <div class="bg-indigo-200 rounded-full p-3">
                      <svg class="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                  
                  <!-- Next Level Progress -->
                  <div class="mt-3">
                    <div class="flex items-center justify-between text-xs text-indigo-800 mb-1">
                      <span>Next Level</span>
                      <span>{points} / {level * 100} points</span>
                    </div>
                    <div class="h-2 bg-indigo-200 rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-indigo-600 rounded-full" 
                        style="width: {Math.min((points % 100) / 100 * 100, 100)}%">
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Special Actions Section -->
                <div class="mt-6">
                  <h4 class="text-sm font-semibold text-gray-700 mb-2">Special Actions</h4>
                  <div class="space-y-2">
                    {#each $pointsStore.goals.filter(g => g.category === 'special') as goal}
                      <div class="{goal.isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'} border rounded-md p-3 flex items-center justify-between transition-colors duration-300">
                        <div class="flex items-center">
                          <div class="{goal.isCompleted ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'} h-10 w-10 rounded-full flex items-center justify-center mr-3 shrink-0">
                            {#if goal.id === 'share-social'}
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                            {:else if goal.id === 'upload-avatar'}
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            {/if}
                          </div>
                          <div>
                            <div class="font-medium text-gray-800">{goal.title}</div>
                            <div class="text-sm text-gray-600">{goal.description}</div>
                            <div class="text-xs font-medium text-indigo-600 mt-1">+{goal.points} points</div>
                          </div>
                        </div>
                        
                        <div>
                          {#if goal.isCompleted}
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                              Completed
                            </span>
                          {:else if goal.id === 'share-social'}
                            <button
                              onclick={() => handleSocialShare(goal.id)}
                              class="inline-flex items-center px-3 py-1.5 border border-indigo-500 rounded-md text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                              Share Now
                            </button>
                          {:else if goal.id === 'upload-avatar'}
                            <button
                              onclick={() => handleAvatarUpload(goal.id)}
                              class="inline-flex items-center px-3 py-1.5 border border-indigo-500 rounded-md text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"></path></svg>
                              Upload
                            </button>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
                
                <!-- Level Rewards -->
                <div class="mt-3">
                  <h4 class="text-sm font-semibold text-gray-700 mb-2">Level Rewards</h4>
                  <div class="space-y-2">
                    <div class="{level >= 1 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border rounded-md p-3 flex items-center justify-between transition-colors duration-300">
                      <div class="flex items-center">
                        <div class="{level >= 1 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'} h-8 w-8 rounded-full flex items-center justify-center mr-3 shrink-0">
                          {#if level >= 1}
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                          {:else}
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>
                          {/if}
                        </div>
                        <div>
                          <div class="font-medium text-gray-800">Level 1</div>
                          <div class="text-sm text-gray-600">1 Month Free Subscription</div>
                        </div>
                      </div>
                      <div class="{level >= 1 ? 'text-green-600' : 'text-gray-400'} text-xs font-medium uppercase">
                        {level >= 1 ? 'Unlocked' : 'Locked'}
                      </div>
                    </div>
                    
                    <div class="{level >= 2 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border rounded-md p-3 flex items-center justify-between transition-colors duration-300">
                      <div class="flex items-center">
                        <div class="{level >= 2 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'} h-8 w-8 rounded-full flex items-center justify-center mr-3 shrink-0">
                          {#if level >= 2}
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                          {:else}
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>
                          {/if}
                        </div>
                        <div>
                          <div class="font-medium text-gray-800">Level 2</div>
                          <div class="text-sm text-gray-600">3 Months Free Subscription</div>
                        </div>
                      </div>
                      <div class="{level >= 2 ? 'text-green-600' : 'text-gray-400'} text-xs font-medium uppercase">
                        {level >= 2 ? 'Unlocked' : 'Locked'}
                      </div>
                    </div>
                    
                    <div class="{level >= 3 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border rounded-md p-3 flex items-center justify-between transition-colors duration-300">
                      <div class="flex items-center">
                        <div class="{level >= 3 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'} h-8 w-8 rounded-full flex items-center justify-center mr-3 shrink-0">
                          {#if level >= 3}
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                          {:else}
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>
                          {/if}
                        </div>
                        <div>
                          <div class="font-medium text-gray-800">Level 3</div>
                          <div class="text-sm text-gray-600">6 Months Free Subscription</div>
                        </div>
                      </div>
                      <div class="{level >= 3 ? 'text-green-600' : 'text-gray-400'} text-xs font-medium uppercase">
                        {level >= 3 ? 'Unlocked' : 'Locked'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
             
            {:else}
              <div class="w-full mt-4">
                <form onsubmit={(e) => { e.preventDefault(); saveProfile(); }}>
                  <div class="mb-4">
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-1 text-left">Name</label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        id="name" 
                        bind:value={userData.name}
                        placeholder="Enter your name"
                        class="w-full border border-gray-300 bg-gray-50 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  
                
                  <div class="flex space-x-3 mt-6">
                    <button 
                      type="button"
                      onclick={(e) => saveProfile()}
                      disabled={isLoading}
                      class="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {#if isLoading}
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17 21 17 13 7 13 7 21"></polyline>
                          <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span>Save Changes</span>
                      {/if}
                    </button>
                    <button 
                      type="button"
                      onclick={(e) => toggleEditMode()}
                      class="flex-1 border border-gray-300 bg-white text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              </div>
            {/if}
            
            <!-- User Points Summary -->
            <div class="border-t border-gray-200 w-full mt-6 pt-6">
              <div class="mt-6 mb-5 pt-5 border-t border-gray-200">
                <h3 class="text-lg font-semibold mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 20V10" />
                    <path d="M12 20V4" />
                    <path d="M6 20v-6" />
                  </svg>
                  Your Progress
                </h3>
                <div class="flex items-center justify-between mb-4 bg-indigo-50 p-3 rounded-lg">
                  <div class="flex items-center">
                    <div class="relative">
                      <div class="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                        {level}
                      </div>
                      <div class="absolute -top-1 -right-1 bg-yellow-400 text-xs font-bold text-gray-800 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="font-semibold text-indigo-900">Level {level}</div>
                      <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-500 mr-1" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10"></circle>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span class="text-sm font-medium text-indigo-800">{points} Points</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-xs bg-indigo-600 text-white py-1 px-3 rounded-full shadow">
                    Rank: #{Math.max(1, 50 - Math.floor(points / 20))}
                  </div>
                </div>
                
                <!-- Progress bar to next level with pulse animation -->
                <div class="relative pt-1">
                  <div class="flex items-center justify-between mb-1">
                    <div class="text-xs font-semibold inline-block text-indigo-600">
                      Level Progress
                    </div>
                    <div class="text-xs font-semibold inline-block text-indigo-600">
                      {points % 100}/{100} XP
                    </div>
                  </div>
                  <div class="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-indigo-100">
                    <div style="width: {(points % 100)}%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"></div>
                  </div>
                  <div class="text-xs text-indigo-500 text-right">{100 - (points % 100)} points to level {level + 1}</div>
                </div>
              </div>
              
              <button 
                onclick={(e) => logout()}
                class="mt-4 flex items-center justify-center space-x-2 text-red-600 hover:text-red-800 transition-colors font-medium bg-red-50 hover:bg-red-100 rounded-lg px-4 py-2 w-full transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right Column - Content -->
      <div class="md:col-span-2">
        <!-- Goals Section -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
          <h2 class="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Your Goals
          </h2>
          
          {#if isPointsLoading}
            <div class="py-8 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p class="mt-2 text-gray-600">Loading your goals...</p>
            </div>
          {:else if goals.length === 0}
            <div class="bg-gray-50 rounded-md p-6 text-center">
              <p class="text-gray-600">No goals available right now.</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each goals as goal}
                <div class="border rounded-lg overflow-hidden {goal.isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200'}">
                  <div class="p-4 flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center">
                        {#if goal.isCompleted}
                          <div class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        {:else}
                          <div class="w-6 h-6 rounded-full border-2 border-gray-300 mr-3"></div>
                        {/if}
                        <h3 class="font-semibold {goal.isCompleted ? 'text-green-800' : 'text-gray-800'}">
                          {goal.title}
                        </h3>
                      </div>
                      <p class="mt-1 text-sm {goal.isCompleted ? 'text-green-600' : 'text-gray-600'} ml-9">{goal.description}</p>
                    </div>
                    
                    <div class="flex flex-col items-end">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {goal.isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                        +{goal.points} points
                      </span>
                      
                      {#if !goal.isCompleted}
                        <button
                          onclick={(e) => completeGoal(goal.id)}
                          class="mt-2 text-xs bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white py-1 px-3 rounded-full flex items-center font-medium shadow-sm transition-all duration-200 transform hover:scale-105"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Complete Goal
                        </button>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Subscription Details -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
          <h2 class="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Subscription Details
          </h2>
          
          {#if isSubscriptionLoading}
            <div class="py-8 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p class="mt-2 text-gray-600">Loading subscription details...</p>
            </div>
          {:else if hasSubscription && subscription}
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 class="font-semibold text-green-800">Active Subscription</h3>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {subscription.planId.toUpperCase()} PLAN
                </span>
              </div>
              
              <div class="ml-11 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p class="text-gray-600">Start Date:</p>
                  <p class="font-medium text-gray-800">{formatDate(subscription.startDate)}</p>
                </div>
                <div>
                  <p class="text-gray-600">Expiry Date:</p>
                  <p class="font-medium text-gray-800">{formatDate(subscription.endDate)}</p>
                </div>
                <div>
                  <p class="text-gray-600">Auto-renew:</p>
                  <p class="font-medium text-gray-800">{subscription.autoRenew ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p class="text-gray-600">Status:</p>
                  <p class="font-medium text-green-600 capitalize">{subscription.status}</p>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end">
              <button
                onclick={(e) => goto('/payment')}
                class="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Manage Subscription
              </button>
            </div>
          {:else}
            <div class="bg-gray-50 rounded-md p-6 text-center">
              <p class="text-gray-600 mb-4">You don't have any active subscriptions.</p>
              <button
                onclick={(e) => goto('/payment')}
                class="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View Subscription Plans
              </button>
            </div>
          {/if}
        </div>
        
        <!-- Quiz History -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
          <h2 class="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Quiz History
          </h2>
          
          {#if isLoading}
            <div class="py-8 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p class="mt-2 text-gray-600">Loading your quiz history...</p>
            </div>
          {:else if quizHistory.length === 0}
            <div class="bg-gray-50 rounded-md p-6 text-center">
              <p class="text-gray-600">You haven't taken any quizzes yet.</p>
              <a 
                href="/quiz"
                class="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium"
              >
                Browse Available Quizzes
              </a>
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  {#each quizHistory as attempt}
                    <tr>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">{attempt.quizTitle}</div>
                        <div class="text-sm text-gray-500">{attempt.category || 'General'}</div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(attempt.completedAt).toLocaleDateString()}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          {attempt.score >= 80 ? 'bg-green-100 text-green-800' : 
                           attempt.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}"
                        >
                          {attempt.score}%
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onclick={(e) => viewQuizResult(attempt.id)}
                          class="text-blue-600 hover:text-blue-900"
                        >
                          View Results
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
        
        <!-- User Statistics -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
          <h2 class="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Your Statistics
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-blue-700">{quizHistory.length}</div>
              <div class="text-sm text-gray-600 mt-1">Quizzes Completed</div>
            </div>
            
            <div class="bg-green-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-green-700">
                {quizHistory.length > 0 ? Math.round(quizHistory.reduce((sum, item) => sum + item.score, 0) / quizHistory.length) : 0}%
              </div>
              <div class="text-sm text-gray-600 mt-1">Average Score</div>
            </div>
            
            <div class="bg-purple-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-purple-700">
                {quizHistory.filter(q => q.score >= 70).length}
              </div>
              <div class="text-sm text-gray-600 mt-1">Quizzes Passed</div>
            </div>
          </div>
        </div>
        
        <!-- Weekly Goals Section -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Your Weekly Goals
          </h2>

          <!-- Achievement Badges Showcase -->
          <div class="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-indigo-800 mb-3">Your Achievement Badges</h3>
            <div class="flex flex-wrap gap-2">
              <!-- Badge 1 - Knowledge Seeker -->
              <div class="relative group">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-md">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <div class="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-sm">3</div>
                <div class="hidden group-hover:block absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white p-2 rounded shadow-lg text-xs text-center w-32 z-10">
                  <p class="font-semibold">Knowledge Seeker</p>
                  <p class="text-gray-600">Read 3 notes this week</p>
                </div>
              </div>
              
              <!-- Badge 2 - Video Enthusiast -->
              <div class="relative group">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div class="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-sm">8</div>
                <div class="hidden group-hover:block absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white p-2 rounded shadow-lg text-xs text-center w-32 z-10">
                  <p class="font-semibold">Video Enthusiast</p>
                  <p class="text-gray-600">Watched 8 videos this week</p>
                </div>
              </div>
              
              <!-- Badge 3 - Quiz Master -->
              <div class="relative group">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                  </svg>
                </div>
                <div class="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-sm">2</div>
                <div class="hidden group-hover:block absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white p-2 rounded shadow-lg text-xs text-center w-32 z-10">
                  <p class="font-semibold">Quiz Master</p>
                  <p class="text-gray-600">Completed 2 quizzes this week</p>
                </div>
              </div>
              
              <!-- Badge 4 - Perfect Score -->
              <div class="relative group">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                  </svg>
                </div>
                <div class="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-sm">1</div>
                <div class="hidden group-hover:block absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white p-2 rounded shadow-lg text-xs text-center w-32 z-10">
                  <p class="font-semibold">Perfect Score</p>
                  <p class="text-gray-600">Got 100% on a quiz</p>
                </div>
              </div>
              
              <!-- Badge 5 - Locked -->
              <div class="relative group">
                <div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center shadow-md opacity-60">
                  <svg class="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <div class="hidden group-hover:block absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white p-2 rounded shadow-lg text-xs text-center w-32 z-10">
                  <p class="font-semibold">Study Streak</p>
                  <p class="text-gray-600">Complete 7 days streak to unlock</p>
                </div>
              </div>
            </div>
          </div>
              
          <div class="space-y-4">
            {#if isPointsLoading}
              <div class="flex justify-center p-4">
                <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            {:else}
              {#each goals.filter(g => g.category === 'weekly') as goal (goal.id)}
                <!-- Goal Card - Enhanced with rewards -->
                <div class="border rounded-lg overflow-hidden {goal.isCompleted ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-white border-gray-200'} transition-all duration-300 hover:shadow-md transform hover:scale-[1.01]">
                  <div class="p-4">
                    <div class="flex items-start justify-between">
                      <div class="flex items-start space-x-3">
                        <div class="{goal.isCompleted ? 'bg-gradient-to-br from-green-100 to-emerald-200 text-green-600' : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600'} p-3 rounded-lg shadow-sm" aria-hidden="true">
                          {#if goal.icon === 'quiz'}
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                          {:else if goal.icon === 'document'}
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          {:else if goal.icon === 'video'}
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          {:else}
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                          {/if}
                        </div>
                        <div>
                          <h3 class="font-semibold text-gray-900 flex items-center">
                            {goal.title}
                            {#if goal.isCompleted}
                              <span class="ml-2 text-green-600">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                              </span>
                            {/if}
                          </h3>
                          <p class="text-sm text-gray-600 mt-1">{goal.description}</p>
                          
                          {#if goal.target && !goal.isCompleted}
                            <div class="mt-3">
                              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span class="font-medium">{goal.progress || 0} / {goal.target}</span>
                              </div>
                              <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" 
                                  style="width: {Math.min(((goal.progress || 0) / goal.target) * 100, 100)}%">
                                </div>
                              </div>
                            </div>
                            
                            <!-- Milestone Markers -->
                            <div class="relative mt-1">
                              <div class="flex justify-between items-center">
                                {#each Array(Math.min(5, goal.target)) as _, i}
                                  {#if (i + 1) % Math.ceil(goal.target / 5) === 0 || i === 0 || i === goal.target - 1}
                                    <div class="relative flex flex-col items-center">
                                      <div class="{(goal.progress || 0) >= i+1 ? 'bg-indigo-500' : 'bg-gray-300'} w-2 h-2 rounded-full"></div>
                                      <span class="text-xs text-gray-500 mt-1">{(i+1) === goal.target ? '100%' : Math.floor((i+1) / goal.target * 100) + '%'}</span>
                                    </div>
                                  {/if}
                                {/each}
                              </div>
                            </div>
                          {/if}
                          
                          <!-- Reward Preview for Completed Goals -->
                          {#if goal.isCompleted}
                            <div class="mt-3 bg-gradient-to-r from-yellow-50 to-amber-50 px-3 py-2 rounded-md border border-yellow-200 flex items-center">
                              <svg class="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd"></path></svg>
                              <span class="text-sm text-amber-700">You earned a <strong>Quiz Master</strong> badge for this achievement!</span>
                            </div>
                          {/if}
                        </div>
                      </div>
                      
                      <div class="flex-shrink-0 flex flex-col items-end">
                        <div class="text-sm font-semibold {goal.isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'} px-3 py-1.5 rounded-full shadow-sm">
                          +{goal.points} pts
                        </div>
                        
                        {#if !goal.isCompleted && goal.progress > 0}
                          <div class="mt-2 text-xs font-medium text-gray-500">
                            {Math.round((goal.progress || 0) / goal.target * 100)}% complete
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
              
              {#if goals.filter(g => g.category === 'weekly').length === 0}
                <div class="text-center py-8 text-gray-500">
                  <p>No weekly goals available right now. Check back soon!</p>
                </div>
              {/if}
            {/if}
          </div>
        </div>
        
        <!-- Achievements Section -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Your Achievements
          </h2>
          
          <div class="space-y-4 mt-4">
            {#if isPointsLoading}
              <div class="flex justify-center p-4">
                <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            {:else}
              {#each goals.filter(g => g.category === 'achievement') as goal (goal.id)}
                <!-- Achievement Card -->
                <div class="border rounded-lg overflow-hidden {goal.isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} transition-colors duration-300">
                  <div class="p-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-3">
                        <div class="{goal.isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'} p-2 rounded-full" aria-hidden="true">
                          {#if goal.icon === 'award'}
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                          {:else if goal.icon === 'calendar'}
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          {:else}
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                          {/if}
                        </div>
                        <div>
                          <h3 class="font-semibold text-gray-900 flex items-center">
                            {goal.title}
                            {#if goal.isCompleted}
                              <span class="ml-2 text-green-600">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                              </span>
                            {/if}
                          </h3>
                          <p class="text-sm text-gray-600 mt-1">{goal.description}</p>
                          
                          {#if goal.target && !goal.isCompleted}
                            <div class="mt-3">
                              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{goal.progress || 0} / {goal.target}</span>
                              </div>
                              <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  class="h-full bg-indigo-500 rounded-full" 
                                  style="width: {Math.min(((goal.progress || 0) / goal.target) * 100, 100)}%">
                                </div>
                              </div>
                            </div>
                          {/if}
                        </div>
                      </div>
                      
                      <div class="flex-shrink-0">
                        <div class="text-sm font-semibold {goal.isCompleted ? 'text-green-600' : 'text-gray-500'} px-2 py-1 rounded-full {goal.isCompleted ? 'bg-green-100' : 'bg-gray-100'}">
                          +{goal.points} pts
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
              
              {#if goals.filter(g => g.category === 'achievement').length === 0}
                <div class="text-center py-8 text-gray-500">
                  <p>Complete activities to unlock achievements!</p>
                </div>
              {/if}
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
