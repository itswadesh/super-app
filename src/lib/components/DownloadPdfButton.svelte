<script lang="ts">
import { downloadPdf } from '$lib/utils/pdfDownload'

// Define props using Svelte 5 runes
const resourceId = $state<string>('')
const resourceType = $state<string>('') // 'note', 'quiz', etc.
const title = $state<string>('')
const price = $state<number>(0) // Default to free
const variant = $state<'primary' | 'secondary' | 'outline'>('primary')
const size = $state<'sm' | 'md' | 'lg'>('md')
const fullWidth = $state<boolean>(false)

// Local state
let isDownloading = $state(false)

// Props definition
export { resourceId, resourceType, title, price, variant, size, fullWidth }

// Handle download with the full authentication and subscription flow
async function handleDownload() {
  isDownloading = true

  try {
    await downloadPdf({
      resourceId: resourceId,
      resourceType: resourceType,
      title: title,
      price: price,
    })
  } finally {
    isDownloading = false
  }
}

// Dynamic classes based on variant and size
const buttonClasses = $derived(
  [
    // Base styles
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none',

    // Variant styles
    variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : '',
    variant === 'secondary' ? 'bg-blue-100 text-blue-900 hover:bg-blue-200' : '',
    variant === 'outline'
      ? 'border border-blue-200 bg-transparent hover:bg-blue-50 text-blue-700'
      : '',

    // Size styles
    size === 'sm' ? 'h-8 px-3 text-xs' : '',
    size === 'md' ? 'h-10 px-4 py-2 text-sm' : '',
    size === 'lg' ? 'h-12 px-6 py-3 text-base' : '',

    // Width
    fullWidth ? 'w-full' : '',
  ]
    .filter(Boolean)
    .join(' ')
)
</script>

<button 
  onclick={(e) => handleDownload()}
  disabled={isDownloading}
  class={buttonClasses}
  type="button"
  aria-label="Download PDF"
>
  {#if isDownloading}
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Downloading...
  {:else}
    <svg class="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Download PDF
  {/if}
</button>
