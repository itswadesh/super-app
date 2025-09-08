<script lang="ts">
import '../app.css'
import { goto, invalidateAll } from '$app/navigation'
import { page } from '$app/state'
import { onMount } from 'svelte'
import { browser } from '$app/environment'
// import { onMount, tick } from 'svelte'
import LoginButton from '$lib/components/LoginButton.svelte'
// Remove LoginModal and Modal if they are only used for the old mobile menu, otherwise keep them.
import LoginModal from '$lib/components/LoginModal.svelte'
// import Modal from '$lib/components/Modal.svelte';
import UserMenu from '$lib/components/UserMenu.svelte'
import { authService } from '$lib/services/auth-service'
import { useAnalytics } from '$lib/stores/analytics_store'
import { loginModal } from '$lib/stores/loginModal'
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
  try {
    const result = await authService.logout()
    console.log('Logout response:', result)
    sheetOpen = false
    await invalidateAll()
    goto('/')
  } catch (error) {
    console.error('Error during logout:', error)
  }
}

const { events, trackPageView } = useAnalytics()
const { children } = $props()

// Dark mode state management
let darkMode = $state(false)

// Toggle dark mode
function toggleDarkMode() {
  darkMode = !darkMode
  if (darkMode) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// Initialize theme from localStorage or system preference
onMount(() => {
  const savedTheme = localStorage.getItem('theme')
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark')
    darkMode = true
  }

  // Check for auth redirect cookie and open login modal if needed
  if (browser) {
    const pathname = window.location.pathname
    const isProtectedRoute =
      !pathname.startsWith('/api/') && pathname !== '/' && pathname !== '/foods'
    const isAuthenticated = page.data?.user?.id

    if (isProtectedRoute && !isAuthenticated) {
      // Get the redirect URL from cookie
      const redirectUrl = document.cookie
        .split('; ')
        .find((row) => row.startsWith('auth_redirect_url='))
        ?.split('=')[1]

      // Open login modal with redirect URL
      loginModal.open({ redirectUrl: redirectUrl || pathname })
    }
  }
})

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

<svelte:head>
  <title>Super App</title>
</svelte:head>

<div class="min-h-screen">
<!-- Header -->
<header class="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 transition-colors duration-200">
  <!-- Top Banner - Logo and Brand -->
  <div class="bg-white dark:bg-gray-900 py-1 transition-colors duration-200">
    <div class="mx-auto px-2 sm:px-3 lg:px-4">
      <div class="flex justify-between items-center">
        <!-- Logo and Brand -->
        <div class="flex items-center">
          <a href="/" class="flex items-center">
            <img src="/logo.png" class="h-8 w-8" alt="Sunabeda Logo" />
            <span class="ml-1 text-xl font-light text-gray-500 dark:text-gray-300 hidden sm:inline transition-colors duration-200">
              | Super App
            </span>
          </a>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex space-x-8 items-center">
          <!-- Add your navigation links here -->
          <!-- Example:
          <a href="/dashboard" class="text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
            Dashboard
          </a>
          -->
        </nav>

        <!-- Action Buttons -->
        <div class="hidden md:flex items-center space-x-4">
         
          
          {#if page.data?.user?.id}
            <UserMenu/>
          {:else}
            <!-- <LoginButton buttonText="Log In" variant="text" class="dark:text-gray-200 dark:hover:text-indigo-400" onclick={(e: any) => { e?.preventDefault(); navigateWithSheetClose('/login'); }} />
            /> -->
            <LoginButton
              buttonText="Log In"
              variant="ghost"
              onclick={() => {}}
            />
          {/if}
        </div>

        <!-- Mobile menu button - Toggles Sheet programmatically -->
        <div class="md:hidden">
          <button
            type="button"
            class="p-3 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative z-50"
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
  <Sheet bind:open={sheetOpen}>
    <SheetContent class="w-[300px] sm:w-[400px] p-6 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      <SheetHeader class="mb-6">
        <SheetTitle>
          <a href="/" class="flex items-center" onclick={(e) => { e.preventDefault(); navigateWithSheetClose('/'); }}>
            <img src="/logo.png" class="h-8 w-8" alt="Sunabeda Logo" />
            <span class="ml-1 text-xl font-light text-gray-500 dark:text-gray-300">| Super App</span>
          </a>
        </SheetTitle>
      </SheetHeader>
      
      <nav class="flex flex-col space-y-1 flex-grow overflow-y-auto">
        <!-- Add your mobile navigation links here -->
        <!-- Example:
        <a 
          href="/dashboard" 
          class="px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          onclick={(e) => { e.preventDefault(); navigateWithSheetClose('/dashboard'); }}
        >
          Dashboard
        </a>
        -->
      </nav>

      <SheetFooter class="mt-auto pt-6 border-t border-gray-200">
        {#if page.data?.user?.id}
          <!-- User Profile Link -->
          <a 
            href="/my/profile" 
            class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
            onclick={(e) => { e.preventDefault(); navigateWithSheetClose('/my/profile'); }}
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
          class="mt-2 w-full text-left block px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
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

<main class="flex w-full flex-col p-4">
    {@render children()} <!-- Changed from <slot /> -->
</main>

  <footer class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-6 mt-auto">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <p>&copy; {new Date().getFullYear()} Misiki. All rights reserved.</p>
        
        <!-- Dark mode toggle -->
         <!-- Theme Toggle for Desktop -->
          <button 
            onclick={toggleDarkMode}
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {#if darkMode}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            {/if}
          </button>
      </div>
    </div>
  </footer>
</div>
<LoginModal />
<Toaster />
