<script lang="ts">
import { page } from '$app/state'
import { type CategoryWithCounts, categoryService } from '$lib/services/category-service'
import { productService } from '$lib/services/product-service'
import type { LearningContent } from './interfaces.d'

import { browser } from '$app/environment'
// Shadcn Components
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardHeader } from '$lib/components/ui/card'
import { ScrollArea } from '$lib/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet'

// Icons
import { Loader2, Filter, X } from '@lucide/svelte'

// Local Components
import ProductGrid from './components/ProductGrid.svelte'
import SubjectBreadcrumb from './components/SubjectBreadcrumb.svelte'
import SubjectChapters from './components/SubjectChapters.svelte'
import SubjectFilters from './components/SubjectFilters.svelte'
import SubjectHero from './components/SubjectHero.svelte'

// Get the subject slug from the URL parameter
const subjectSlug = page.params.slug as string

// Component state
let category = $state<CategoryWithCounts | null>(null)
let products = $state({ count: 0, data: [] as LearningContent[] })
let isLoading = $state(true)
let error = $state<string | null>(null)
let showMobileFilters = $state(false)

// Filter states
let selectedType = $state('all')
const selectedFilters = $state<Record<string, string[]>>({})
let currentPage = $state(1)
const itemsPerPage = 12

// Filter options
const filterOptions = [
  {
    id: 'difficulty',
    name: 'Difficulty',
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    id: 'language',
    name: 'Language',
    options: ['English', 'Spanish', 'French', 'German'],
  },
  {
    id: 'format',
    name: 'Format',
    options: ['Video', 'Text', 'Interactive'],
  },
]

// Product types for the dropdown
const productTypes = [
  { id: 'all', name: 'All Resources' },
  { id: 'video', name: 'Videos' },
  { id: 'note', name: 'Notes' },
  { id: 'quiz', name: 'Quizzes' },
]

const areFiltersActive = $derived(
  Object.values(selectedFilters).some((values) => values?.length > 0) || selectedType !== 'all'
)

function clearAllFilters(): void {
  for (const key in selectedFilters) {
    if (Object.prototype.hasOwnProperty.call(selectedFilters, key)) {
      selectedFilters[key] = []
    }
  }
  selectedType = 'all' // Reset type filter as well
  currentPage = 1 // Reset pagination
  filterProducts()
}

// Handle page change from the ProductGrid component
function handlePageChange(event: CustomEvent<{ page: number }>) {
  currentPage = event.detail.page
  // In a real app, you would fetch the new page of data here
  // For now, we're just updating the current page
}

// Handle filter change from the ProductGrid component
function handleGridFilterChange(
  event: CustomEvent<{ filterId: string; value: string; checked: boolean }>
) {
  const { filterId, value, checked } = event.detail
  handleFilterChange(filterId, value, checked)
}

// Fetch subject data function
async function fetchCategoryData(): Promise<void> {
  try {
    isLoading = true
    error = null

    const categoryData = await categoryService.getCategoryBySlug(page.params.slug)
    if (!categoryData) {
      error = 'Category not found.'
      return
    }

    category = categoryData

    const productsData = await productService.list({ categories: [category.id] })
    products = {
      count: productsData.total || 0,
      data: productsData.data || [],
    }
  } catch (err) {
    console.error('Error fetching subject data:', err)
    error = 'Failed to load subject data. Please try again later.'
  } finally {
    isLoading = false
  }
}

// Handle filter changes
function handleFilterChange(filterId: string, value: string, checked: boolean): void {
  if (!selectedFilters[filterId]) {
    selectedFilters[filterId] = []
  }

  if (checked) {
    selectedFilters[filterId].push(value)
  } else {
    selectedFilters[filterId] = selectedFilters[filterId].filter((v) => v !== value)
  }

  filterProducts()
}

// Handle product type change
function handleProductTypeChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target) {
    selectedType = target.value
    currentPage = 1 // Reset to first page when changing type
    filterProducts()
  }
}

// Filter products based on selected filters and type
function filterProducts(): void {
  if (!products.data || !products.data.length) return

  // Always start with the original data to avoid compounding filters
  let filtered = [...products.data]

  try {
    // Filter by type if not 'all'
    if (selectedType !== 'all') {
      filtered = filtered.filter((product) => product.type === selectedType)
    }

    // Apply other filters
    for (const [filterId, values] of Object.entries(selectedFilters)) {
      if (!values?.length) continue

      filtered = filtered.filter((product) => {
        // Handle difficulty filter
        if (filterId === 'difficulty' && 'difficulty' in product) {
          try {
            const difficultyStr = String(product.difficulty || '')
            const level =
              difficultyStr.charAt(0).toUpperCase() + difficultyStr.slice(1).toLowerCase()
            return values.includes(level)
          } catch (e) {
            console.error('Error processing difficulty filter:', e)
            return false
          }
        }

        // Handle language filter
        if (filterId === 'language' && 'language' in product) {
          try {
            const languageMap: Record<string, string> = {
              en: 'English',
              hi: 'Hindi',
              or: 'Odia',
              bn: 'Bengali',
            }
            const languageName =
              languageMap[product.language as keyof typeof languageMap] || product.language
            return values.includes(languageName)
          } catch (e) {
            console.error('Error processing language filter:', e)
            return false
          }
        }

        // Handle format filter if needed
        if (filterId === 'format' && 'format' in product) {
          return values.includes(String(product.format))
        }

        return true
      })
    }

    // Update the products with filtered data
    products = { ...products, data: filtered }
  } catch (error) {
    console.error('Error in filterProducts:', error)
    // Reset to original data on error
    products = { ...products, data: [...products.data] }
  }
}

// SEO metadata
const pageTitle = $derived(
  category?.name ? `${category.name} - Learning Resources` : 'Learning Resources'
)

const metaDescription = $derived(
  category?.description || `Explore ${category?.name || 'learning'} resources`
)

// Update document title and meta tags
$effect(() => {
  if (!category) return
  document.title = pageTitle

  const descriptionMeta = document.querySelector('meta[name="description"]')
  if (descriptionMeta) {
    descriptionMeta.setAttribute('content', metaDescription)
  }
})

// Structured data for SEO
const structuredData = $derived({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: category?.name || '',
  description: category?.description || '',
  provider: {
    '@type': 'Organization',
    name: 'Super App',
    sameAs: 'https://superapp.in',
  },
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'student',
  },
  educationalLevel: category?.gradeLevel || '',
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    duration: `PT${category?.totalTimeMinutes || 0}M`,
    instanceOf: {
      '@type': 'Course',
      name: category?.name || '',
    },
  },
  numberOfLessons: category?.totalLessons || 0,
})

// Reset state when slug changes
$effect(() => {
  if (browser && page.params.slug) {
    // Reset states when slug changes
    isLoading = true
    category = null
    products = { count: 0, data: [] }
    selectedType = 'all'
    // Clear selected filters by mutating the existing object
    for (const key of Object.keys(selectedFilters)) {
      delete selectedFilters[key]
    }
    currentPage = 1

    // Fetch new data
    fetchCategoryData()
  }
})
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={metaDescription} />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta property="og:url" content={`https://superapp.in/${category?.slug || ''}`} />
  {#if category?.thumbnailUrl}
    <meta
      property="og:image"
      content={`https://superapp.in${category.thumbnailUrl}`}
    />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={metaDescription} />
  {#if category?.thumbnailUrl}
    <meta
      name="twitter:image"
      content={`https://superapp.in${category.thumbnailUrl}`}
    />
  {/if}
</svelte:head>

<main class="container mx-auto px-2 sm:px-3 lg:px-4 min-h-screen" aria-labelledby="subject-title">
  {#if isLoading}
    <div class="flex flex-col items-center justify-center h-64 gap-4" aria-live="polite">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <p class="text-muted-foreground">Loading content...</p>
    </div>
  {:else if error}
    <Card class="border-destructive">
      <CardHeader class="flex flex-row items-center gap-4">
        <div class="bg-destructive/10 p-2 rounded-full">
          <X class="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 class="text-sm font-medium text-destructive">Error loading content</h3>
          <p class="text-sm text-muted-foreground">{error}</p>
        </div>
      </CardHeader>
    </Card>
  {:else if !category}
    <div class="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <h2 class="text-2xl font-semibold">Category Not Found</h2>
      <p class="text-muted-foreground">The requested category could not be found.</p>
      <Button variant="outline" onclick={() => window.history.back()}>
        Go Back
      </Button>
    </div>
  {:else}
    <!-- Breadcrumb Navigation -->
    {#if category}
      <SubjectBreadcrumb 
        category={{
          name: category.name,
          slug: category.slug
        }}
      />
      
      <!-- Subject Hero Section -->
      <SubjectHero 
        category={{
          name: category.name,
          description: category.description,
          thumbnailUrl: category.thumbnailUrl
        }}
        class=""
      />
      
      <!-- Subject Stats -->
      <!-- <SubjectStats 
        stats={{
          videosCount: category.videosCount,
          notesCount: category.notesCount,
          quizzesCount: category.quizzesCount
        }}
      /> -->
      
      <!-- Chapters Section -->
      {#if category.children?.length > 0}
        <SubjectChapters chapters={category.children} />
      {/if}

      <!-- Filters Section -->
      <!-- <SubjectFilters
        filterOptions={filterOptions}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
      /> -->
    {/if}

    <!-- Learning Product Section Organized by Chapters -->
    <section class="learning-product-section" aria-labelledby="learning-product-heading">
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Desktop Filters Sidebar -->
        <aside class="hidden lg:block w-64 flex-shrink-0">
          <Card class="border">
            <CardHeader class="p-3 border-b">
              <div class="flex items-center justify-between">
                <h3 class="font-medium text-sm">Filters</h3>
                {#if areFiltersActive}
                  <Button variant="ghost" size="xs" class="h-6 px-2 text-xs" onclick={clearAllFilters}>
                    Clear All
                  </Button>
                {/if}
              </div>
            </CardHeader>
            <CardContent class="p-3">
              <SubjectFilters 
                filters={filterOptions} 
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
              />
            </CardContent>
          </Card>
        </aside>

        <!-- Main Content -->
        <div class="flex-1">
          <!-- Mobile filter toggle button -->
          <div class="lg:hidden mb-3">
            <Sheet bind:open={showMobileFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" class="w-full justify-start gap-2 h-9">
                  <Filter class="h-3.5 w-3.5" />
                  <span class="text-sm">Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" class="w-[280px] p-0">
                <div class="h-full flex flex-col">
                  <div class="p-3 border-b">
                    <div class="flex items-center justify-between">
                      <h3 class="font-medium">Filters</h3>
                      {#if areFiltersActive}
                        <Button variant="ghost" size="icon" onclick={() => { clearAllFilters(); showMobileFilters = false; }}>
                          <X class="h-4 w-4" />
                        </Button>
                      {/if}
                    </div>
                  </div>
                  <ScrollArea class="flex-1 p-3">
                    <SubjectFilters 
                      filters={filterOptions} 
                      selectedFilters={selectedFilters}
                      onFilterChange={handleFilterChange}
                    />
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <!-- Subcategories -->
          <!-- {#if category.subcategoriesCount > 0}
            <div class="mb-8">
              <h2 class="text-xl font-semibold mb-4">Subcategories</h2>
              <div class="text-gray-600">
                This category has {category.subcategoriesCount} subcategories. 
                <a href="/categories" class="text-blue-600 hover:underline">Browse all categories</a>
              </div>
            </div>
          {/if} -->
          <!-- Product Grid Component -->
          {#if products.data.length > 0}
            <div class="w-full">
              <ProductGrid
                products={products.data}
                isLoading={isLoading}
                error={error}
                totalCount={products.count}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                on:pageChange={handlePageChange}
                on:filter={handleGridFilterChange}
                class="compact"
              />
            </div>
          {:else}
            <div class="flex flex-col items-center justify-center py-8 text-center">
              <div class="bg-muted/50 p-4 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
              <h3 class="text-base font-medium mb-1.5">
                {#if areFiltersActive}
                  No content matches your filters
                {:else}
                  No content available
                {/if}
              </h3>
              <p class="text-muted-foreground text-sm max-w-md mx-auto mb-3">
                {#if areFiltersActive}
                  Try adjusting or clearing your filters to see more results.
                {:else}
                  There are no resources in this category yet. Check back later or explore other categories.
                {/if}
              </p>
              {#if areFiltersActive}
                <Button variant="outline" size="sm" onclick={clearAllFilters}>
                  <X class="mr-1.5 h-3.5 w-3.5" /> Clear All Filters
                </Button>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </section>
  {/if}
</main>
