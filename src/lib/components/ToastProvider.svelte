<script context="module" lang="ts">
// Define toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

// Interface for a toast object
export interface Toast {
  id: string
  title?: string
  message: string
  type: ToastType
  duration: number
  timestamp: number
}
</script>

<script lang="ts">
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';

  // Create a store for our toasts
  let toasts: Toast[] = [];

  // Generate a unique ID for each toast
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Get icon based on toast type
  function getIcon(type: ToastType) {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'loading': return '⏳';
      default: return '';
    }
  }

  // Get background color class based on toast type
  function getBgClass(type: ToastType) {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-500';
      case 'error': return 'bg-red-50 border-red-500';
      case 'warning': return 'bg-yellow-50 border-yellow-500';
      case 'info': return 'bg-blue-50 border-blue-500';
      case 'loading': return 'bg-gray-100 border-gray-400';
      default: return 'bg-white border-gray-300';
    }
  }

  // Add a new toast
  function addToast(options: { type: ToastType; message: string; title?: string; duration?: number }) {
    const id = generateId();
    const toast: Toast = {
      id,
      message: options.message,
      title: options.title,
      type: options.type,
      duration: options.type === 'loading' ? Infinity : (options.duration || 4000),
      timestamp: Date.now()
    };
    
    toasts.push(toast);
    
    // Auto-remove toast after duration (unless it's loading)
    if (toast.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }
    
    return id;
  }

  // Remove a toast by ID
  function removeToast(id: string) {
    const index = toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.splice(index, 1);
    }
  }
  
  // Update a toast (for converting loading to success/error)
  function updateToast(id: string, options: { type?: ToastType; message?: string; title?: string }) {
    const index = toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      const updatedToast = { ...toasts[index], ...options };
      toasts[index] = updatedToast;
      
      // If we're changing from loading, set a timeout to remove
      if (options.type && options.type !== 'loading') {
        setTimeout(() => {
          removeToast(id);
        }, 3000);
      }
    }
  }

  // Expose the toast functions globally
  onMount(() => {
    if (typeof window !== 'undefined') {
      (window as any).toastHelpers = {
        addToast,
        removeToast,
        updateToast
      };
    }
  });
</script>

<div class="fixed top-0 right-0 z-[9999] flex flex-col gap-2 p-4 md:max-w-[420px] w-full max-h-screen">
  {#each toasts as toast (toast.id)}
    <div
      class="flex items-center gap-3 rounded-md border p-4 shadow-md overflow-hidden {getBgClass(toast.type)}"
      transition:fade={{ duration: 200 }}
    >
      <span class="text-xl">{getIcon(toast.type)}</span>
      <div class="flex-1">
        {#if toast.title}
          <div class="font-medium text-gray-900">{toast.title}</div>
        {/if}
        <div class="text-sm text-gray-700">{toast.message}</div>
      </div>
      {#if toast.type !== 'loading'}
        <button
          class="rounded-md p-1 text-gray-500 hover:bg-gray-200"
          onclick={() => removeToast(toast.id)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span class="sr-only">Close</span>
        </button>
      {/if}
    </div>
  {/each}
</div>

