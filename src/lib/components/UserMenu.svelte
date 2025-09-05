<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import { page } from '$app/state'
import { authService } from '$lib/services/auth-service'
import { onMount } from 'svelte'
import { fade } from 'svelte/transition'
import { userStore } from '$lib/stores/userStore'

let isMenuOpen = $state(false)
let menuRef = $state<HTMLDivElement | null>(null)

// Close the menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (menuRef && !menuRef.contains(event.target as Node)) {
    isMenuOpen = false
  }
}

// Handle logout
async function handleLogout() {
  try {
    // Use authService for logout
    const result = await authService.logout()
    // Log debug info
    console.log('Logout response:', result)
    // Update UI
    isMenuOpen = false
    // await invalidateAll()
    window.location.reload()
    // window.location.href='/'
    // goto('/')
  } catch (error) {
    console.error('Error during logout:', error)
    // Still try to clear local state even if server request fails
    // userStore.logout();
  }
}

// Toggle menu
function toggleMenu() {
  isMenuOpen = !isMenuOpen
}

// Add click event listener
onMount(() => {
  document.addEventListener('click', handleClickOutside)

  return () => {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<div class="relative" bind:this={menuRef}>
  <!-- User Avatar and Button -->
  <button
    type="button"
    class="flex items-center space-x-2 focus:outline-none cursor-pointer"
    onclick={toggleMenu}
    aria-expanded={isMenuOpen}
    aria-haspopup="true"
  >
    <div
      class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold pointer-events-none"
    >
      {page.data?.user?.name
        ? page.data.user.name.charAt(0).toUpperCase()
        : "U"}
    </div>
    <span class="text-gray-700 hidden sm:inline pointer-events-none"
      >
      {page.data?.user?.name || "User"}
    </span>
    <svg
      class="h-5 w-5 text-gray-400 pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clip-rule="evenodd"
      />
    </svg>
  </button>

  <!-- Dropdown Menu -->
  {#if isMenuOpen}
    <div
      class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 origin-top-right"
      transition:fade={{ duration: 100 }}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu"
    >
      <div class="px-4 py-2 border-b border-gray-100">
        <p class="text-sm font-medium text-gray-700">
          {page.data?.user?.name || "User"}
        </p>
        <p class="text-xs text-gray-500 truncate">
          {page.data?.user?.phone || ""}
        </p>
      </div>

      <a
        href="/profile"
        onclick={() => (isMenuOpen = false)}
        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        role="menuitem"
      >
        Your Profile
      </a>
      <!-- <a href="/orders" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
        Your Orders
      </a>
      <a href="/saved" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
        Saved Items
      </a> -->
      {#if page.data?.user?.role === "admin"}
        <a
          href="/admin"
          onclick={() => (isMenuOpen = false)}
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          role="menuitem"
        >
          Admin Dashboard
        </a>
      {/if}
      <button
        onclick={handleLogout}
        class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 dark:hover:bg-background hover:bg-gray-100 border-t border-gray-100"
        role="menuitem"
      >
        Sign Out
      </button>
    </div>
  {/if}
</div>
