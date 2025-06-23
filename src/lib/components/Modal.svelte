<script lang="ts">
import { browser } from '$app/environment'
import { fade } from 'svelte/transition'

// Props using Svelte 5 runes
const {
  open = false,
  title = '',
  closeOnEscape = true,
  closeOnClickOutside = true,
  showCloseButton = true,
  size = 'md', // 'sm', 'md', 'lg', 'xl', 'full'
  onClose = () => {},
} = $props()

// State variables
let modal = $state<HTMLElement | null>(null)
let previouslyFocused = $state<HTMLElement | null>(null)
let isVisible = $state(open)

// Watch for changes to open prop
$effect(() => {
  isVisible = open

  // Handle body scroll locking
  if (browser) {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Size classes
const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
}

// Compute current size class
const sizeClass = $derived(sizeClasses[size as keyof typeof sizeClasses] || 'max-w-lg')

// Focus management
$effect(() => {
  if (isVisible && browser) {
    // Store previous focus state
    previouslyFocused = document.activeElement as HTMLElement

    // Focus the first focusable element in the modal
    setTimeout(() => {
      if (modal) {
        const focusable = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length > 0) {
          ;(focusable[0] as HTMLElement).focus()
        }
      }
    }, 50)
  } else if (!isVisible && previouslyFocused) {
    // Restore focus when modal closes
    previouslyFocused.focus()
  }
})

// Close modal function
function close() {
  isVisible = false
  onClose()
}

// Handle keyboard events
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && closeOnEscape) {
    close()
  }
}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    role="dialog"
    aria-modal="true"
  >
    <div class="flex items-center justify-center min-h-screen p-4 text-center">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        role="button"
        tabindex="0"
        onclick={() => closeOnClickOutside && close()}
        onkeydown={(e) => e.key === "Enter" && closeOnClickOutside && close()}
        aria-label="Close modal"
      ></div>

      <!-- Modal panel -->
      <div
        bind:this={modal}
        class="relative bg-white rounded-xl shadow-2xl w-full {sizeClass} max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
        style="backdrop-filter: blur(10px);"
        role="dialog"
        transition:fade
      >
        <!-- Modal header -->
        <div
          class="relative px-6 py-5 bg-gradient-to-r from-indigo-600 to-blue-500"
        >
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-white">{title}</h3>
            {#if showCloseButton}
              <button
                type="button"
                class="text-white hover:text-gray-100 focus:outline-none transition-all duration-200 hover:scale-110"
                onclick={close}
                aria-label="Close"
              >
                <svg
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            {/if}
          </div>
        </div>

        <!-- Modal content -->
        <div class="overflow-y-auto p-6 bg-white bg-opacity-95">
          <slot />
        </div>

        <!-- Add a subtle gradient at the bottom -->
        <div
          class="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"
        ></div>
      </div>
    </div>
  </div>
{/if}
