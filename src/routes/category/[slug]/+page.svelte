<script lang="ts">
import { goto } from '$app/navigation'
import type { PageData } from './$types'

// Get the data loaded from the server
const { data } = $props<{ data: PageData }>()

// Reactive state
const category = $state(data.category)
const resources = $state(data.resources || [])
const subcategories = $state(data.subcategories || [])
const resourceCounts = $state(data.resourceCounts || { videos: 0, notes: 0, quizzes: 0, total: 0 })
const pagination = $state(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 12 })
const filters = $state(data.filters || { type: 'all', search: '', sort: 'newest' })

// UI state
let searchInput = $state(filters.search || '')

// Resource types for filter
const resourceTypes = [
  { id: 'all', name: 'All Resources' },
  { id: 'videos', name: 'Videos' },
  { id: 'notes', name: 'Notes' },
  { id: 'quizzes', name: 'Quizzes' },
]

// Sort options
const sortOptions = [
  { id: 'newest', name: 'Newest First' },
  { id: 'oldest', name: 'Oldest First' },
  { id: 'title', name: 'A-Z' },
]

// Format date for display
function formatDate(dateValue: string | number | Date) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

// Handle search form submission
function handleSearch(event: Event) {
  event.preventDefault()
  const url = new URL(window.location.href)
  url.searchParams.set('search', searchInput)
  window.location.href = url.toString()
}

// Clear search
function clearSearch() {
  const url = new URL(window.location.href)
  url.searchParams.delete('search')
  window.location.href = url.toString()
}

// Handle filter change
function handleFilterChange(filterType: string, value: string) {
  const url = new URL(window.location.href)
  url.searchParams.set(filterType, value)
  url.searchParams.set('page', '1') // Reset to first page
  window.location.href = url.toString()
}

// Get resource icon based on type
function getResourceIcon(type: string) {
  switch (type) {
    case 'video':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>`
    case 'note':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>`
    case 'quiz':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>`
  }
}

// Get badge color based on resource type
function getResourceBadgeClass(type: string) {
  switch (type) {
    case 'video':
      return 'bg-red-100 text-red-800'
    case 'note':
      return 'bg-blue-100 text-blue-800'
    case 'quiz':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Get resource URL
function getResourceUrl(resource: any) {
  const type = resource.resourceType
  const slug = resource.slug

  switch (type) {
    case 'video':
      return `/video/${slug}`
    case 'note':
      return `/note/${slug}`
    case 'quiz':
      return `/quiz/${slug}`
    default:
      return '#'
  }
}

// Initialize search input from URL
const _ = $derived(() => {
  searchInput = filters.search || ''
})
</script>

<svelte:head>
  <title>{category ? category.name : 'Category'} | Learning Resources</title>
  <meta name="description" content={category ? `Browse ${category.name} learning resources including videos, notes, and quizzes` : 'Browse learning resources by category'} />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  {#if category}
    <!-- Breadcrumb Navigation -->
    <nav class="text-sm mb-6">
      <ol class="list-none p-0 inline-flex">
        <li class="flex items-center">
          <a href="/" class="text-blue-600 hover:text-blue-800">Home</a>
          <svg class="w-3 h-3 mx-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
          </svg>
        </li>
        <li class="flex items-center">
          <a href="/category" class="text-blue-600 hover:text-blue-800">Categories</a>
          <svg class="w-3 h-3 mx-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
          </svg>
        </li>
        <li class="text-gray-700">{category.name}</li>
      </ol>
    </nav>

    <!-- Category Header -->
    <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">{category.name}</h1>
          {#if category.description}
            <p class="text-gray-600 mt-2">{category.description}</p>
          {/if}
        </div>
        
        <div class="mt-4 md:mt-0 flex gap-4">
          <div class="stats flex gap-3">
            <div class="stat bg-blue-50 p-2 rounded-lg flex items-center">
              <div class="stat-figure text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="ml-2">
                <div class="stat-title text-xs">Notes</div>
                <div class="stat-value text-sm font-bold">{resourceCounts.notes}</div>
              </div>
            </div>
            
            <div class="stat bg-red-50 p-2 rounded-lg flex items-center">
              <div class="stat-figure text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="ml-2">
                <div class="stat-title text-xs">Videos</div>
                <div class="stat-value text-sm font-bold">{resourceCounts.videos}</div>
              </div>
            </div>
            
            <div class="stat bg-green-50 p-2 rounded-lg flex items-center">
              <div class="stat-figure text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-2">
                <div class="stat-title text-xs">Quizzes</div>
                <div class="stat-value text-sm font-bold">{resourceCounts.quizzes}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Subcategories -->
    {#if subcategories.length > 0}
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-4">Subcategories</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {#each subcategories as subcat}
            <a href={`/category/${subcat.slug}`} class="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
              <h3 class="font-semibold text-lg">{subcat.name}</h3>
              {#if subcat.description}
                <p class="text-gray-600 text-sm line-clamp-2 mt-1">{subcat.description}</p>
              {/if}
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <div class="lg:flex gap-6">
      <!-- Sidebar with Filters -->
      <div class="lg:w-1/4 lg:pr-8 mb-6 lg:mb-0">
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">Search</h2>
          <div class="relative">
            <form onsubmit={handleSearch}>
              <input 
                type="text" 
                class="w-full px-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Search in this category..." 
                bind:value={searchInput}
              />
              {#if filters.search}
                <button 
                  type="button" 
                  class="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onclick={clearSearch}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </button>
              {/if}
              <button type="submit" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">Resource Type</h2>
          <ul class="space-y-2">
            {#each resourceTypes as type}
              <li>
                <button 
                  class={`flex items-center w-full py-2 px-3 rounded-lg ${filters.type === type.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                  onclick={() => handleFilterChange('type', type.id)}
                >
                  <span>{type.name}</span>
                  <span class="ml-auto text-sm bg-gray-200 text-gray-700 py-1 px-2 rounded-full">
                    {type.id === 'all' ? resourceCounts.total : resourceCounts[type.id]}
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">Sort By</h2>
          <div class="space-y-2">
            {#each sortOptions as option}
              <button 
                class={`flex items-center w-full py-2 px-3 rounded-lg ${filters.sort === option.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                onclick={() => handleFilterChange('sort', option.id)}
              >
                <span>{option.name}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="lg:w-3/4">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold">Resources</h2>
            <div class="text-gray-600">
              Showing {Math.min(pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
            </div>
          </div>

          {#if resources.length === 0}
            <div class="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
              <h3 class="mt-4 text-lg font-medium text-gray-900">No resources found</h3>
              <p class="mt-1 text-gray-500">Try changing your search or filter criteria.</p>
              {#if filters.search || filters.type !== 'all'}
                <button 
                  class="mt-4 text-blue-600 hover:text-blue-800"
                  onclick={() => window.location.href = `/category/${category.slug}`}
                >
                  Clear all filters
                </button>
              {/if}
            </div>
          {:else}
            <div class="space-y-4">
              {#each resources as resource}
                <a 
                  href={getResourceUrl(resource)}
                  class="block p-4 border rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-start gap-4"
                >
                  <!-- Resource Icon/Image -->
                  <div class="flex-shrink-0">
                    {#if resource.resourceType === 'video' && resource.thumbnailUrl}
                      <div class="w-20 h-16 relative rounded overflow-hidden">
                        <img src={resource.thumbnailUrl} alt={resource.title} class="w-full h-full object-cover" />
                        <div class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white opacity-80" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    {:else}
                      <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                        {@html getResourceIcon(resource.resourceType)}
                      </div>
                    {/if}
                  </div>
                  
                  <!-- Resource Content -->
                  <div class="flex-grow min-w-0">
                    <div class="flex justify-between items-start">
                      <h3 class="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{resource.title}</h3>
                      <span class={`ml-2 px-2 py-1 text-xs rounded-full ${getResourceBadgeClass(resource.resourceType)}`}>
                        {resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)}
                      </span>
                    </div>
                    
                    <p class="text-gray-600 line-clamp-2 mb-2">{resource.description || 'No description available'}</p>
                    
                    <div class="flex items-center text-sm text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(resource.createdAt)}</span>
                      
                      {#if resource.resourceType === 'video' && resource.duration}
                        <span class="mx-2">•</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{resource.duration}</span>
                      {/if}
                      
                      {#if resource.resourceType === 'note' && resource.fileType}
                        <span class="mx-2">•</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{resource.fileType}</span>
                      {/if}
                      
                      {#if resource.resourceType === 'quiz' && resource.difficulty}
                        <span class="mx-2">•</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>{resource.difficulty}</span>
                      {/if}
                    </div>
                  </div>
                </a>
              {/each}
            </div>
          {/if}

          <!-- Pagination -->
          {#if pagination.totalPages > 1}
            <div class="flex justify-center mt-8">
              <nav class="flex items-center">
                <a 
                  href={`?page=${Math.max(1, pagination.currentPage - 1)}&type=${filters.type}&sort=${filters.sort}${filters.search ? `&search=${filters.search}` : ''}`}
                  class="px-3 py-1 rounded-lg mr-2 border ${pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-blue-600'}"
                  class:pointer-events-none={pagination.currentPage === 1}
                >
                  Previous
                </a>
                
                {#each Array(pagination.totalPages) as _, i}
                  <a 
                    href={`?page=${i + 1}&type=${filters.type}&sort=${filters.sort}${filters.search ? `&search=${filters.search}` : ''}`}
                    class="px-3 py-1 rounded-lg mx-1 border ${pagination.currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50 text-blue-600'}"
                  >
                    {i + 1}
                  </a>
                {/each}
                
                <a 
                  href={`?page=${Math.min(pagination.totalPages, pagination.currentPage + 1)}&type=${filters.type}&sort=${filters.sort}${filters.search ? `&search=${filters.search}` : ''}`}
                  class="px-3 py-1 rounded-lg ml-2 border ${pagination.currentPage === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-blue-600'}"
                  class:pointer-events-none={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </a>
              </nav>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline">Category not found.</span>
      <a href="/category" class="block mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block">Back to Categories</a>
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;  
    overflow: hidden;
  }
</style>
