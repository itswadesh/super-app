<script lang="ts">
import '../app.css'
import { goto } from '$app/navigation'
import { page } from '$app/state'
// import { onMount, tick } from 'svelte'
import LoginButton from '$lib/components/LoginButton.svelte'
// Remove LoginModal and Modal if they are only used for the old mobile menu, otherwise keep them.
import LoginModal from '$lib/components/LoginModal.svelte'
// import Modal from '$lib/components/Modal.svelte';
import UserMenu from '$lib/components/UserMenu.svelte'
import { authService } from '$lib/services/auth-service'
import { useAnalytics } from '$lib/stores/analytics_store'
// import { apiService } from '$lib/services/api.service'
// Import Shadcn Sheet components
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose, // Optional: if you want a dedicated close button inside the sheet
  SheetFooter, // Optional: for a footer section
} from '$lib/components/ui/sheet' // Adjust path if your ui components are elsewhere
import { Toaster } from 'svelte-sonner'

let sheetOpen = $state(false) // State to control the Sheet component

$effect(() => {
  const link = document.createElement('link')

  link.href =
    'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
  document.body.classList.add('font-dm-sans')

  return () => {
    document.head.removeChild(link)
    document.body.classList.remove('font-dm-sans')
  }
})

async function handleLogout() {
  await authService.logout()
  sheetOpen = false // Close sheet on logout
}

const { events, trackPageView } = useAnalytics()
const { children } = $props()

// No longer need mobileMenuOpen state, Sheet handles its own state
// let mobileMenuOpen = $state(false);
let categories = $state<Array<{ id: string; name: string; slug: string }>>([])
let categoriesLoading = $state(true)

// onMount(async () => {
//   try {
// const response = await apiService.getCategories()
// categories.set(response.data)
//   } catch (error) {
//     console.error('Error fetching categories:', error)
//   } finally {
//     categoriesLoading = false
//   }
// })

$effect(() => {
  let isMounted = true

  return () => {
    isMounted = false
  }
})

// No longer need toggleMobileMenu and closeMobileMenu, Sheet handles this
// function toggleMobileMenu() {
//   mobileMenuOpen = !mobileMenuOpen;
// }

// function closeMobileMenu() {
//   mobileMenuOpen = false;
// }

// We'll call SheetClose or navigate directly from links inside the sheet
async function navigateWithSheetClose(path: string) {
  sheetOpen = false
  // Ensure Svelte processes the state change for 'sheetOpen' before navigating
  // Option 1: setTimeout (often sufficient)
  setTimeout(() => {
    goto(path)
    trackPageView(path) // Assuming trackPageView is defined elsewhere or part of useAnalytics()
  }, 0)

  // Option 2: Using tick (more Svelte-idiomatic for awaiting updates)
  // await tick();
  // goto(path);
  // trackPageView(path);
}
</script>

<!-- Header -->
<header class="bg-white shadow-sm sticky top-0 z-50">
  <!-- Top Banner - Logo and Brand -->
  <div class="bg-white py-1">
    <div class="mx-auto max-w-7xl px-2 sm:px-3 lg:px-4">
      <div class="flex justify-between items-center">
        <!-- Logo and Brand -->
        <div class="flex items-center">
          <a href="/" class="flex items-center">
            <img src="/logo.png" class="h-8 w-8" alt="Sunabeda Logo" />
            <span class="ml-1 text-xl font-light text-gray-500 hidden sm:inline"
              >
              | HAL
              </span
            >
          </a>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex space-x-8 items-center">
        
        </nav>

        <!-- Action Buttons -->
        <div class="hidden md:flex items-center space-x-4">
          <!-- {#if page.data?.user?.id}
            <UserMenu/>
          {:else}
            <LoginButton buttonText="Log In" variant="text" onclick={(e: any) => { e.preventDefault(); navigateWithSheetClose('/login'); }} />
          {/if} -->
        </div>

        <!-- Mobile menu button - Toggles Sheet programmatically -->
        <div class="md:hidden">
          <button
            type="button"
            class="p-3 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors relative z-50"
            onclick={() => sheetOpen = !sheetOpen} 
            aria-label="Toggle menu"
            aria-expanded={sheetOpen ? "true" : "false"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              {#if sheetOpen} 
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              {:else}
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              {/if}
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</header> 
  <!-- Shadcn Sheet for Mobile Navigation -->
  <Sheet bind:open={sheetOpen} >
    <SheetContent class="w-[300px] sm:w-[400px] p-6 flex flex-col">
      <SheetHeader class="mb-6">
        <SheetTitle>
          <a href="/" class="flex items-center" onclick={(e) => { e.preventDefault(); navigateWithSheetClose('/'); }}>
            <img src="/logo.png" class="h-8 w-8" alt="Sunabeda Logo" />
            <span class="ml-1 text-xl font-light text-gray-500">| HAL</span>
          </a>
        </SheetTitle>
      </SheetHeader>
      
      <nav class="flex flex-col space-y-3 flex-grow overflow-y-auto">
       
      </nav>

      <SheetFooter class="mt-auto pt-6 border-t border-gray-200">
        {#if page.data?.user?.id}
          <!-- User Profile Link -->
          <a 
            href="/profile" 
            class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
            onclick={(e) => { e.preventDefault(); navigateWithSheetClose('/profile'); }}
          >
            My Profile
          </a>
          
          <!-- Logout Button -->
          <button 
            onclick={() => {
              sheetOpen = false; // Ensure sheet closes before logout logic
              setTimeout(async () => {
                  await handleLogout(); // handleLogout might also navigate or cause re-renders
              }, 0);
            }} 
            class="mt-2 w-full text-left block px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            Log Out
          </button>
        {:else}
          <LoginButton
            buttonText="Log In" 
            variant="primary" 
            onclick={() => {
              sheetOpen = false;
            }}
          />
        {/if}
      </SheetFooter>
    </SheetContent>
  </Sheet>

<main class="flex min-h-screen w-full flex-col">
    {@render children()} <!-- Changed from <slot /> -->
</main>

  <footer class="bg-gray-100 text-gray-600 py-8 mt-auto">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
      <p>&copy; {new Date().getFullYear()} HAL Koraput. All rights reserved.</p>
      <p class="text-sm">
        <!-- <a href="/privacy" class="hover:text-indigo-600">Privacy Policy</a> |
        <a href="/terms" class="hover:text-indigo-600">Terms of Service</a> -->
      </p>
    </div>
  </footer>

    <LoginModal />

<Toaster />
