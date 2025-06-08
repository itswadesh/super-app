<script lang="ts">
import ProductCard from '$lib/components/ProductCard.svelte'
import type { LearningContent } from '../interfaces.d'

// Props
const props = $props()
const products: LearningContent[] = props.products
const isLoading = props.isLoading
const error: string | null = props.error
const emptyMessage = props.emptyMessage
const totalCount = props.totalCount
const currentPage = props.currentPage
const itemsPerPage = props.itemsPerPage
let sortBy = props.sortBy

// Events
import { createEventDispatcher } from 'svelte'
const dispatch = createEventDispatcher<{
  sort: { value: string }
  pageChange: { page: number }
  filter: { filterId: string; value: string; checked: boolean }
}>()

// Computed values
const totalPages = $derived(Math.ceil(totalCount / itemsPerPage))
const showingFrom = $derived(totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1)
const showingTo = $derived(Math.min(currentPage * itemsPerPage, totalCount))

// Handle sort change
function handleSortChange(event: Event) {
  const target = event.target as HTMLSelectElement
  dispatch('sort', { value: target.value })
}

// Handle page change
function handlePageChange(page: number) {
  if (page >= 1 && page <= totalPages) {
    dispatch('pageChange', { page })
  }
}

// Handle filter change
function handleFilterChange(filterId: string, value: string, checked: boolean) {
  dispatch('filter', { filterId, value, checked })
}
</script>

<div class="space-y-6">
 <!--  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <p class="text-sm text-gray-600">
      Showing {showingFrom}-{showingTo} of {totalCount} results
    </p>
    
    <div class="flex items-center gap-3">
      <div class="relative">
        <label for="sort-by" class="sr-only">Sort by</label>
        <select
          id="sort-by"
          class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          on:change={handleSortChange}
          bind:value={sortBy}
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="a-z">A - Z</option>
          <option value="z-a">Z - A</option>
        </select>
      </div>
    </div>
  </div> -->

  <!-- Loading State -->
  {#if isLoading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each { length: 6 } as _, i (i)}
        <div class="bg-white rounded-lg shadow-sm border overflow-hidden h-full animate-pulse">
          <div class="h-40 bg-gray-200"></div>
          <div class="p-4">
            <div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
      {/each}
    </div>
  
  <!-- Error State -->
  {:else if error}
    <div class="bg-red-50 border-l-4 border-red-400 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">
            {error}
          </p>
        </div>
      </div>
    </div>
  
  <!-- Empty State -->
  {:else if products.length === 0}
    <div class="col-span-full text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1"
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No products found</h3>
      <p class="mt-1 text-sm text-gray-500">{emptyMessage}</p>
    </div>
  
  <!-- Product Grid -->
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each products as product (product.id)}
        <ProductCard 
          id={product.id}
          title={product.title}
          slug={product.slug}
          type={product.type}
          description={product.description}
          image={product.image}
          thumbnailUrl={product.thumbnailUrl}
          duration={product.duration}
          difficulty={product.difficulty}
          tags={product.tags}
          progress={product.progress}
          completionStatus={product.completionStatus}
          price={product.price}
          salePrice={product.salePrice}
          isFeatured={product.isFeatured}
          stock={product.stock}
          rank={product.rank}
          categoryId={product.categoryId}
          sku={product.sku}
          features={product.features}
          specifications={product.specifications}
        />
      {/each}
    </div>
    
    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="mt-8 flex justify-center">
        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button
            disabled={currentPage === 1}
            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={() => handlePageChange(currentPage - 1)}
          >
            <span class="sr-only">Previous</span>
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          
          {#each Array(totalPages > 5 ? 5 : totalPages) as _, i}
            {#if totalPages <= 5 || i < 2 || i >= 3 || Math.abs(currentPage - (i + 1)) <= 1}
              <button
                class={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  i + 1 === currentPage 
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
                onclick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            {:else if (i === 2 && currentPage > 4) || (i === totalPages - 3 && currentPage < totalPages - 3)}
              <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                ...
              </span>
            {/if}
          {/each}
          
          <button
            disabled={currentPage === totalPages}
            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={() => handlePageChange(currentPage + 1)}
          >
            <span class="sr-only">Next</span>
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    {/if}
  {/if}
</div>
