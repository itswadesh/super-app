<script lang="ts">
// Define the product props with Svelte 5 runes
const props = $props<{
  id: number
  title: string
  slug: string
  type: 'video' | 'notes' | 'quiz'
  description: string
  image: string
  thumbnailUrl?: string
  duration?: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  progress?: number
  completionStatus?: 'not_started' | 'in_progress' | 'completed'
  price?: number
  salePrice?: number
  isFeatured?: boolean
  stock?: number
  rank?: number
  categoryId?: string
  sku?: string
  features?: string[]
  specifications?: Record<string, unknown>
  hasAccess?: boolean
}>()

// Destructure props with defaults
const {
  id,
  title,
  slug,
  type,
  description = '',
  image = '',
  thumbnailUrl = image, // Fallback to image if thumbnailUrl is not provided
  duration = 0,
  difficulty = 'beginner',
  tags = [],
  progress = 0,
  completionStatus = 'not_started',
  price,
  salePrice,
  isFeatured = false,
  stock,
  rank,
  categoryId,
  sku,
  features = [],
  specifications = {},
  hasAccess = false,
} = props

// Check if the product is premium (has a price > 0)
const isPremium = $derived(price ? price > 0 : false)

// Map product types to icons and labels
const productTypeInfo = {
  video: { icon: '🎬', label: 'Video' },
  notes: { icon: '📝', label: 'Notes' },
  mcq: { icon: '❓', label: 'MCQ' },
}

// Derive the type info based on the product type
const typeInfo = $derived(
  productTypeInfo[type as keyof typeof productTypeInfo] || {
    icon: '📦',
    label: type || 'Unknown',
  }
)

// Format the duration for display
const formattedDuration = $derived(duration ? `${Math.ceil(duration)} min` : '')
</script>

<!-- Component template starts here -->

<a
  href="/{type}/{slug || '#'}"
  class="group product-card bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-200 {isFeatured ? 'border-yellow-100' : 'border-gray-200'}"
  aria-labelledby="product-{id}"
>
  <div class="product-image relative h-40 bg-gray-100 overflow-hidden">
    <div class="relative w-full h-full">
      <img
        src={thumbnailUrl || '/placeholder-image.jpg'}
        alt={title || 'Product image'}
        class="w-full h-full object-cover"
        loading="lazy"
      />
      {#if isPremium && !hasAccess}
        <div class="absolute top-2 right-2 bg-yellow-100 text-yellow-800 p-1.5 rounded-full shadow-sm" title="Premium Content">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        </div>
      {/if}
    </div>
    
    <!-- Featured Ribbon -->
    {#if isFeatured}
      <div class="absolute -right-8 top-2 w-32 bg-yellow-400 text-yellow-900 text-xs font-bold py-1 text-center transform rotate-45 shadow-md">
        <span class="flex items-center justify-center">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Featured
        </span>
      </div>
      <!-- Gold border for featured items -->
      <div class="absolute inset-0 border-2 border-yellow-400 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
    {/if}
    
    <!-- Product Type Badge -->
    <span class="absolute bottom-2 right-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
      {typeInfo.icon} {typeInfo.label}
    </span>
  </div>
  <div class="p-4 flex-1 flex flex-col">
    <h3 class="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200" id="product-{id}">
      {title || 'Untitled Product'}
    </h3>
    
    <div class="mt-auto pt-2 flex justify-end">
      {#if formattedDuration}
        <span class="text-xs text-gray-500">
          {formattedDuration}
        </span>
      {/if}
    </div>
  </div>
</a>
