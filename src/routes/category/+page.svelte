<script lang="ts">
import { enhance } from '$app/forms'
import type { PageData } from './$types'
import type { Category } from './+page.server'

// Get the data loaded from the server
const { data } = $props<{ data: PageData }>()

// Reactive state
const categories = $state(data.categories || [])
const allCategories = $state(data.allCategories || [])
const categoryTree = $state(data.categoryTree || [])
const pagination = $state(
  data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 50 }
)
const filters = $state(data.filters || { search: '' })
const error = $state(data.error || false)

// Form state
let editMode = $state(false)
let formVisible = $state(false)
let currentCategory = $state<Partial<Category>>({})
let searchInput = $state('')
let formSuccess = $state<string | null>(null)
let formError = $state<string | null>(null)

// Category types
const categoryTypes = [
  { id: 'root', name: 'Root' },
  { id: 'school_board', name: 'School Board' },
  { id: 'board', name: 'Board' },
  { id: 'class', name: 'Class' },
  { id: 'subject', name: 'Subject' },
  { id: 'topic', name: 'Topic' },
]

// Reset form state
function resetForm() {
  currentCategory = {}
  editMode = false
  formVisible = false
  formSuccess = null
  formError = null
}

// Show create form
function showCreateForm() {
  resetForm()
  formVisible = true
}

// Show edit form
function showEditForm(category: Category) {
  currentCategory = { ...category }
  editMode = true
  formVisible = true
}

// Handle slug generation
function generateSlug() {
  if (currentCategory.name) {
    currentCategory.slug = currentCategory.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  }
}

// Handle form submission result
function handleFormResult(result: { success: boolean; message: string }) {
  if (result.success) {
    formSuccess = result.message
    setTimeout(() => {
      formSuccess = null
      resetForm()
      // Reload the page to refresh the data
      window.location.reload()
    }, 2000)
  } else {
    formError = result.message
  }
}

// Handle search submission
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

// Initialize search input from URL
$effect(() => {
  searchInput = filters.search || ''
})

// Recursive function to display category tree
function displayCategoryTree(categories: Category[], depth = 0) {
  return categories
    .map(
      (category) => `
      <div class="category-tree-item" style="padding-left: ${depth * 20}px">
        <div class="flex items-center py-2">
          <a href="/category/${category.slug}" class="font-medium text-blue-600 hover:text-blue-800 hover:underline">${category.name}</a>
          <span class="ml-2 text-xs text-gray-500">(${category.type || 'No Type'})</span>
        </div>
        ${category.children && category.children.length ? displayCategoryTree(category.children, depth + 1) : ''}
      </div>
    `
    )
    .join('')
}
</script>

<svelte:head>
  <title>Category Management | Learning Resources</title>
  <meta name="description" content="Manage categories for your learning resources" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold text-gray-800">Category Management</h1>
    <button 
      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
      onclick={showCreateForm}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Add Category
    </button>
  </div>

  <!-- Breadcrumb Navigation -->
  <nav class="text-sm mb-6">
    <ol class="list-none p-0 inline-flex">
      <li class="flex items-center">
        <a href="/" class="text-blue-600 hover:text-blue-800">Home</a>
        <svg class="w-3 h-3 mx-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
        </svg>
      </li>
      <li class="text-gray-700">Categories</li>
    </ol>
  </nav>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline">We couldn't load the categories. Please try again later.</span>
    </div>
  {:else}
    <div class="lg:flex gap-6">
      <!-- Left Side: Category Tree -->
      <div class="lg:w-1/3 p-4 bg-white rounded-lg shadow mb-6 lg:mb-0">
        <h2 class="text-xl font-semibold mb-4">Category Hierarchy</h2>
        <div class="category-tree border rounded-lg p-4 max-h-[600px] overflow-y-auto">
          {#if categoryTree.length === 0}
            <p class="text-gray-500 italic">No categories found</p>
          {:else}
            {@html displayCategoryTree(categoryTree)}
          {/if}
        </div>
      </div>

      <!-- Right Side: Category List and Form -->
      <div class="lg:w-2/3">
        <!-- Search and Filter -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <form onsubmit={handleSearch} class="flex gap-2">
            <div class="flex-grow relative">
              <input 
                type="text" 
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Search categories..." 
                bind:value={searchInput}
              />
              {#if filters.search}
                <button 
                  type="button" 
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onclick={clearSearch}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </button>
              {/if}
            </div>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </button>
          </form>
        </div>

        <!-- Category Form -->
        {#if formVisible}
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">{editMode ? 'Update Category' : 'Create New Category'}</h2>
            
            {#if formSuccess}
              <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span class="block sm:inline">{formSuccess}</span>
              </div>
            {/if}
            
            {#if formError}
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span class="block sm:inline">{formError}</span>
              </div>
            {/if}
            
            <form 
              method="POST" 
              action="?/{editMode ? 'updateCategory' : 'createCategory'}"
              use:enhance={({ form, data, action, cancel }) => {
                return async ({ result }) => {
                  handleFormResult(result.data);
                };
              }}
              class="space-y-4"
            >
              {#if editMode}
                <input type="hidden" name="id" value={currentCategory.id} />
              {/if}
              
              <div>
                <label for="name" class="block text-gray-700 font-medium mb-2">Name *</label>
                <input 
                  id="name" 
                  name="name" 
                  type="text" 
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                  bind:value={currentCategory.name}
                  onblur={generateSlug}
                />
              </div>
              
              <div>
                <label for="slug" class="block text-gray-700 font-medium mb-2">Slug *</label>
                <input 
                  id="slug" 
                  name="slug" 
                  type="text" 
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                  bind:value={currentCategory.slug}
                />
              </div>
              
              <div>
                <label for="description" class="block text-gray-700 font-medium mb-2">Description</label>
                <textarea 
                  id="description" 
                  name="description" 
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24" 
                  bind:value={currentCategory.description}
                ></textarea>
              </div>
              
              <div>
                <label for="type" class="block text-gray-700 font-medium mb-2">Type</label>
                <select 
                  id="type" 
                  name="type" 
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  bind:value={currentCategory.type}
                >
                  <option value="">Select Type</option>
                  {#each categoryTypes as type}
                    <option value={type.id}>{type.name}</option>
                  {/each}
                </select>
              </div>
              
              <div>
                <label for="parentId" class="block text-gray-700 font-medium mb-2">Parent Category</label>
                <select 
                  id="parentId" 
                  name="parentId" 
                  class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  bind:value={currentCategory.parentId}
                >
                  <option value="">No Parent (Root Category)</option>
                  {#each allCategories as cat}
                    {#if !editMode || (editMode && cat.id !== currentCategory.id)}
                      <option value={cat.id}>{cat.name}</option>
                    {/if}
                  {/each}
                </select>
              </div>
              
              <div class="flex gap-2 pt-4">
                <button 
                  type="submit" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                  {editMode ? 'Update' : 'Create'}
                </button>
                <button 
                  type="button" 
                  class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition"
                  onclick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        {/if}

        <!-- Category List -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#if categories.length === 0}
                  <tr>
                    <td colspan="4" class="px-6 py-4 text-center text-gray-500 italic">No categories found</td>
                  </tr>
                {:else}
                  {#each categories as category (category.id)}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            <a href="/category/{category.slug}" class="text-blue-600 hover:text-blue-800 hover:underline">{category.name}</a>
                          </div>
                          <div class="text-sm text-gray-500">{category.description || 'No description'}</div>
                        </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-900">{category.type || 'Not specified'}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-900">
                          {#if category.parentId}
                            {allCategories.find(c => c.id === category.parentId)?.name || 'Unknown'}
                          {:else}
                            None (Root)
                          {/if}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex justify-end gap-2">
                          <a 
                            href="/category/{category.slug}" 
                            class="text-green-600 hover:text-green-900"
                          >
                            View
                          </a>
                          <button 
                            class="text-blue-600 hover:text-blue-900 ml-3"
                            onclick={() => showEditForm(category)}
                          >
                            Edit
                          </button>
                          <form 
                            method="POST" 
                            action="?/deleteCategory"
                            use:enhance={({ form, data, action, cancel }) => {
                              if (!confirm(`Are you sure you want to delete ${category.name}?`)) {
                                cancel();
                              }
                              return async ({ result }) => {
                                handleFormResult(result.data);
                              };
                            }}
                          >
                            <input type="hidden" name="id" value={category.id} />
                            <button type="submit" class="text-red-600 hover:text-red-900 ml-4">Delete</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        {#if pagination && pagination.totalPages > 1}
          <div class="flex justify-center mt-6">
            <nav class="flex items-center">
              <a 
                href={`?page=${Math.max(1, pagination.currentPage - 1)}${filters.search ? `&search=${filters.search}` : ''}`}
                class="px-3 py-1 rounded-lg mr-2 border ${pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-blue-600'}"
                class:pointer-events-none={pagination.currentPage === 1}
              >
                Previous
              </a>
              
              {#each Array(pagination.totalPages) as _, i}
                <a 
                  href={`?page=${i + 1}${filters.search ? `&search=${filters.search}` : ''}`}
                  class="px-3 py-1 rounded-lg mx-1 border ${pagination.currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50 text-blue-600'}"
                >
                  {i + 1}
                </a>
              {/each}
              
              <a 
                href={`?page=${Math.min(pagination.totalPages, pagination.currentPage + 1)}${filters.search ? `&search=${filters.search}` : ''}`}
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
  {/if}
</div>

<style>
  .category-tree-item {
    border-left: 2px solid #e5e7eb;
    margin-bottom: 2px;
    transition: all 0.2s;
  }
  
  .category-tree-item:hover {
    border-left-color: #3b82f6;
    background-color: #f9fafb;
  }
</style>
