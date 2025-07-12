<script lang="ts">
import { onMount } from 'svelte'
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShoppingCart,
  User,
  Lock,
  Unlock,
} from '@lucide/svelte'
import { publicApis, protectedApis } from './api-list'

type Side = 'left' | 'right'

interface AuthConfig {
  loginEndpoint: string
  tokenKey: string
}

interface ApiResult {
  loading: boolean
  left: unknown
  right: unknown
  error: string | null
  isEqual: boolean
}

interface ApiResults {
  [key: string]: ApiResult
}

// Default to localhost for both in development
let leftBaseUrl = 'http://localhost:3000/api'
let rightBaseUrl = 'http://localhost:3000/api'

// Auth configuration for svelte-commerce
const authConfig: AuthConfig = {
  loginEndpoint: '/auth/login',
  tokenKey: 'svelte-commerce-token',
}

// Auth state
let leftToken = ''
let rightToken = ''
let isAuthenticated: Record<Side, boolean> = {
  left: false,
  right: false,
}

// UI state
let activeCategory: string | null = null
let expandedApis = $state<Record<string, boolean>>({})
let results = $state<ApiResults>({})

// Group APIs by their first segment and type (public/protected)
function groupApis(apis: string[], requiresAuth: boolean): GroupedApis {
  return apis.reduce<GroupedApis>((acc, api) => {
    const [category] = api.split('/').filter(Boolean)
    if (category) {
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push({ path: api, requiresAuth })
    }
    return acc
  }, {})
}

// Create reactive state
const allGroupedApis = $state({
  public: groupApis(publicApis, false),
  protected: groupApis(protectedApis, true),
})

// For backward compatibility
const groupedApis = $derived({
  ...allGroupedApis.public,
  ...allGroupedApis.protected,
})

// Toggle API expansion
function toggleExpand(api: string) {
  expandedApis = {
    ...expandedApis,
    [api]: !expandedApis[api],
  }
}

// Login to svelte-commerce API
async function login(side: Side) {
  const baseUrl = side === 'left' ? leftBaseUrl : rightBaseUrl
  const email = side === 'left' ? 'admin@example.com' : 'user@example.com' // Default test credentials
  const password = side === 'left' ? 'admin123' : 'user123' // Default test credentials

  try {
    const response = await fetch(`${baseUrl}${authConfig.loginEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`)
    }

    const data = await response.json()
    const token = data.token || data.accessToken

    if (token) {
      if (side === 'left') {
        leftToken = token
      } else {
        rightToken = token
      }
      isAuthenticated[side] = true
      // Store token in localStorage for persistence
      localStorage.setItem(`${authConfig.tokenKey}-${side}`, token)
    } else {
      throw new Error('No token received in login response')
    }
  } catch (error) {
    console.error(`Login failed for ${side} side:`, error)
    alert(`Login failed: ${error.message}`)
  }
}

// Check if API requires authentication
function requiresAuth(apiPath: string): boolean {
  return protectedApis.some((protectedApi) =>
    new RegExp(`^${protectedApi.replace(/:[^/]+/g, '[^/]+')}$`).test(apiPath)
  )
}

// Call API on both sides and compare
async function callApi(apiPath: string) {
  const needsAuth = requiresAuth(apiPath)

  if (needsAuth && (!isAuthenticated.left || !isAuthenticated.right)) {
    alert('This endpoint requires authentication. Please login to both APIs first.')
    return
  }

  // Initialize result object
  results[apiPath] = {
    loading: true,
    left: null,
    right: null,
    error: null,
    isEqual: false,
  }

  try {
    // Call both APIs in parallel
    const [leftRes, rightRes] = await Promise.all([
      fetchApi('left', apiPath),
      fetchApi('right', apiPath),
    ])

    // Compare responses
    const leftJson = await safeJsonParse(leftRes)
    const rightJson = await safeJsonParse(rightRes)

    results[apiPath] = {
      loading: false,
      left: leftJson,
      right: rightJson,
      error: null,
      isEqual: JSON.stringify(leftJson) === JSON.stringify(rightJson),
    }
  } catch (error) {
    results[apiPath] = {
      loading: false,
      left: null,
      right: null,
      error: error.message,
      isEqual: false,
    }
  }

  // Update reactive state
  results = { ...results }
  expandedApis = { ...expandedApis, [apiPath]: true }
}

// Helper to safely parse JSON
async function safeJsonParse(response: Response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : null
  } catch (e) {
    return text || 'Empty response'
  }
}

// Make API call with auth for svelte-commerce
async function fetchApi(side: Side, endpoint: string) {
  const baseUrl = (side === 'left' ? leftBaseUrl : rightBaseUrl).replace(/\/+$/, '')
  const token = side === 'left' ? leftToken : rightToken
  const fullEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (requiresAuth(endpoint) && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${baseUrl}${fullEndpoint}`, {
      headers,
      method: endpoint.includes('cart') ? 'POST' : 'GET',
      ...(endpoint.includes('cart') && { body: '{}' }),
    })
    return response
  } catch (error) {
    console.error(`Error fetching ${endpoint} from ${side}:`, error)
    throw error
  }
}

// Call all APIs in a category
function callAllInCategory(category: string) {
  const categoryApis = allGroupedApis.public[category] || allGroupedApis.protected[category] || []
  return Promise.all(categoryApis.map((api) => callApi(api.path)))
}
</script>

<div class="min-h-screen bg-gray-100">
  <!-- Header -->
  <header class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <ShoppingCart class="w-6 h-6" />
        svelte-commerce API Comparator
      </h1>
      <div class="flex items-center gap-2">
        <a href="https://github.com/itswadesh/svelte-commerce" target="_blank" class="text-sm text-gray-600 hover:text-gray-900">
          GitHub
        </a>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
    <!-- Login Section -->
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <h2 class="text-lg font-medium mb-4">API Authentication</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Left API (Production) -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Production API URL</label>
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={leftBaseUrl}
                placeholder="https://api.example.com"
                class="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                onclick={() => login('left')}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
              >
                {isAuthenticated.left ? 'Re-authenticate' : 'Auto Login'}
              </button>
            </div>
            {#if isAuthenticated.left}
              <p class="mt-1 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle class="w-4 h-4" />
                Authenticated
              </p>
            {/if}
          </div>
        </div>

        <!-- Right API (Local) -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Local API URL</label>
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={rightBaseUrl}
                placeholder="http://localhost:3000"
                class="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                onclick={() => login('right')}
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
              >
                {isAuthenticated.right ? 'Re-authenticate' : 'Auto Login'}
              </button>
            </div>
            {#if isAuthenticated.right}
              <p class="mt-1 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle class="w-4 h-4" />
                Authenticated
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- API List -->
    <div class="space-y-6">
      <!-- Public APIs Section -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h2 class="text-lg font-medium flex items-center gap-2">
            <Unlock class="w-5 h-5 text-green-600" />
            Public APIs (No Login Required)
          </h2>
        </div>
        {#each Object.entries(allGroupedApis.public) as [category, categoryApis]}
          {#if categoryApis && categoryApis.length > 0}
            <div class="border-b last:border-b-0">
              <button
                onclick={() => {
                  const newActiveCategory = activeCategory === `public-${category}` ? null : `public-${category}`;
                  activeCategory = newActiveCategory;
                  if (newActiveCategory && categoryApis[0]) {
                    expandedApis = { ...expandedApis, [categoryApis[0].path]: true };
                  }
                }}
                class="w-full px-6 py-4 text-left font-medium flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span class="capitalize">{category}</span>
                <div class="flex items-center gap-2">
                  <!-- <button
                    onclick|stopPropagation={() => callAllInCategory(category)}
                    class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Test All
                  </button> -->
                  {#if activeCategory === `public-${category}`} 
                    <ChevronUp class="w-5 h-5" /> 
                  {:else}
                    <ChevronDown class="w-5 h-5" />
                  {/if}
                </div>
              </button>
              
              {#if activeCategory === `public-${category}`}
                <div class="divide-y">
                  {#if Array.isArray(categoryApis)}
                    {#each categoryApis as { path: apiPath, requiresAuth }}
                      <div class="bg-gray-50">
                        <div class="px-6 py-3 flex justify-between items-center">
                          <div class="font-mono text-sm">
                            {apiPath}
                            {#if requiresAuth}
                              <span class="ml-2 text-xs text-red-600">(Auth Required)</span>
                            {/if}
                          </div>
                          <div class="flex items-center gap-2">
                            {#if results[apiPath]?.loading}
                              <div class="text-sm text-gray-500">Testing...</div>
                            {:else if results[apiPath]}
                              <div class="flex items-center gap-1">
                                {#if results[apiPath].isEqual}
                                  <div class="text-green-600 flex items-center gap-1">
                                    <CheckCircle class="w-4 h-4" />
                                    <span class="text-sm">Match</span>
                                  </div>
                                {:else if results[apiPath].error}
                                  <div class="text-red-600 flex items-center gap-1">
                                    <XCircle class="w-4 h-4" />
                                    <span class="text-sm">Error</span>
                                  </div>
                                {:else}
                                  <div class="text-yellow-600 flex items-center gap-1">
                                    <AlertTriangle class="w-4 h-4" />
                                    <span class="text-sm">Mismatch</span>
                                  </div>
                                {/if}
                              </div>
                            {/if}
                            <button
                              onclick={() => callApi(apiPath)}
                              class="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                            >
                              Test
                            </button>
                            <button
                              onclick={() => toggleExpand(apiPath)}
                              class="p-1 text-gray-500 hover:text-gray-700"
                            >
                              {#if expandedApis[apiPath]}
                                <ChevronUp class="w-4 h-4" />
                              {:else}
                                <ChevronDown class="w-4 h-4" />
                              {/if}
                            </button>
                          </div>
                        </div>
                        
                        {#if expandedApis[apiPath] && results[apiPath]}
                          <div class="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Left API Response -->
                            <div class="border rounded p-3 bg-white">
                              <h4 class="font-medium text-sm mb-2">Production Response</h4>
                              <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">
                                {JSON.stringify(results[apiPath].left || results[apiPath].error, null, 2)}
                              </pre>
                            </div>
                            
                            <!-- Right API Response -->
                            <div class="border rounded p-3 bg-white">
                              <h4 class="font-medium text-sm mb-2">Local Response</h4>
                              <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">
                                {JSON.stringify(results[apiPath].right || results[apiPath].error, null, 2)}
                              </pre>
                            </div>
                            
                            <!-- Diff Summary -->
                            {#if !results[apiPath].isEqual && !results[apiPath].error}
                              <div class="col-span-full mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                <div class="font-medium text-yellow-800 mb-1">Differences Found:</div>
                                <div class="text-yellow-700">
                                  The API responses do not match. Please check the response details above.
                                </div>
                              </div>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    {/each}
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        {/each}
      </div>

        <!-- Protected APIs Section -->
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b">
            <h2 class="text-lg font-medium flex items-center gap-2">
              <Lock class="w-5 h-5 text-red-600" />
              Protected APIs (Login Required)
              {#if !isAuthenticated.left || !isAuthenticated.right}
                <span class="text-sm text-red-600">(Please login to test these endpoints)</span>
              {/if}
            </h2>
          </div>
          {#each Object.entries(allGroupedApis.protected) as [category, apis]}
            {#if apis && apis.length > 0}
              <div class="border-b last:border-b-0">
                <button
                  onclick={() => {
                    const newActiveCategory = activeCategory === `protected-${category}` ? null : `protected-${category}`;
                    activeCategory = newActiveCategory;
                    if (newActiveCategory && apis[0]) {
                      expandedApis = { ...expandedApis, [apis[0].path]: true };
                    }
                  }}
                  class="w-full px-6 py-4 text-left font-medium flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span class="capitalize">{category}</span>
                  <div class="flex items-center gap-2">
                    <!-- <button
                      onclick|stopPropagation={() => callAllInCategory(category)}
                      class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Test All
                    </button> -->
                    {#if activeCategory === `protected-${category}`}
                      <ChevronUp class="w-5 h-5" />
                    {:else}
                      <ChevronDown class="w-5 h-5" />
                    {/if}
                  </div>
                </button>
                
                {#if activeCategory === `protected-${category}`}
                  <div class="divide-y">
                    {#if Array.isArray(apis)}
                      {#each apis as { path: apiPath, requiresAuth }}
                        <div class="bg-gray-50">
                          <div class="px-6 py-3 flex justify-between items-center">
                            <div class="font-mono text-sm">
                              {apiPath}
                              {#if requiresAuth}
                                <span class="ml-2 text-xs text-red-600">(Auth Required)</span>
                              {/if}
                            </div>
                            <div class="flex items-center gap-2">
                              {#if results[apiPath]?.loading}
                                <div class="text-sm text-gray-500">Testing...</div>
                              {:else if results[apiPath]}
                                <div class="flex items-center gap-1">
                                  {#if results[apiPath].isEqual}
                                    <div class="text-green-600 flex items-center gap-1">
                                      <CheckCircle class="w-4 h-4" />
                                      <span class="text-sm">Match</span>
                                    </div>
                                  {:else if results[apiPath].error}
                                    <div class="text-red-600 flex items-center gap-1">
                                      <XCircle class="w-4 h-4" />
                                      <span class="text-sm">Error</span>
                                    </div>
                                  {:else}
                                    <div class="text-yellow-600 flex items-center gap-1">
                                      <AlertTriangle class="w-4 h-4" />
                                      <span class="text-sm">Mismatch</span>
                                    </div>
                                  {/if}
                                </div>
                              {/if}
                              <button
                                onclick={() => callApi(apiPath)}
                                class="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                              >
                                Test
                              </button>
                              <button
                                onclick={() => toggleExpand(apiPath)}
                                class="p-1 text-gray-500 hover:text-gray-700"
                              >
                                {#if expandedApis[apiPath]}
                                  <ChevronUp class="w-4 h-4" />
                                {:else}
                                  <ChevronDown class="w-4 h-4" />
                                {/if}
                              </button>
                            </div>
                          </div>
                          
                          {#if expandedApis[apiPath] && results[apiPath]}
                            <div class="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <!-- Left API Response -->
                              <div class="border rounded p-3 bg-white">
                                <h4 class="font-medium text-sm mb-2">Production Response</h4>
                                <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">
                                  {JSON.stringify(results[apiPath].left || results[apiPath].error, null, 2)}
                                </pre>
                              </div>
                              
                              <!-- Right API Response -->
                              <div class="border rounded p-3 bg-white">
                                <h4 class="font-medium text-sm mb-2">Local Response</h4>
                                <pre class="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">
                                  {JSON.stringify(results[apiPath].right || results[apiPath].error, null, 2)}
                                </pre>
                              </div>
                              
                              <!-- Diff Summary -->
                              {#if !results[apiPath].isEqual && !results[apiPath].error}
                                <div class="col-span-full mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                  <div class="font-medium text-yellow-800 mb-1">Differences Found:</div>
                                  <div class="text-yellow-700">
                                    The API responses do not match. Please check the response details above.
                                  </div>
                                </div>
                              {/if}
                            </div>
                          {/if}
                        </div>
                      {/each}
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
  </main>
</div>