<script lang="ts">
import { createDrawer } from '@melt-ui/svelte'
import { onMount } from 'svelte'

// Svelte 5 runes
let users = $state([
  { id: 1, name: 'Alice', email: 'alice@email.com', role: 'user', status: 'active' },
  { id: 2, name: 'Bob', email: 'bob@email.com', role: 'admin', status: 'active' },
  { id: 3, name: 'Charlie', email: 'charlie@email.com', role: 'user', status: 'inactive' },
])

let search = $state('')
let selectedUser = $state(null)
let isLoading = $state(false)
let error = $state(null)

const filtered_users = $derived(
  users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )
)

// Create drawer
const {
  elements: { trigger, content, title, description, close },
  states: { open },
} = createDrawer({
  position: 'right',
  preventScroll: true,
  closeOnEscape: true,
  closeOnOutsideClick: true,
})

async function viewUser(userId: string) {
  try {
    isLoading = true
    error = null

    // Fetch user details from the API
    const response = await fetch(`/api/admin/users/${userId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch user details')
    }

    const userData = await response.json()
    selectedUser = userData
    open.set(true)
  } catch (err) {
    console.error('Error fetching user:', err)
    error = err.message || 'Failed to load user details'
  } finally {
    isLoading = false
  }
}

// Format date for display
function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<div class="p-6">
  <h1 class="text-2xl font-bold mb-4">Users</h1>
  <input type="text" class="mb-4 p-2 border rounded w-full" placeholder="Search users..." bind:value={search} />
  <table class="min-w-full bg-white rounded shadow">
    <thead>
      <tr>
        <th class="py-2 px-4 border-b">ID</th>
        <th class="py-2 px-4 border-b">Name</th>
        <th class="py-2 px-4 border-b">Email</th>
        <th class="py-2 px-4 border-b">Role</th>
        <th class="py-2 px-4 border-b">Status</th>
        <th class="py-2 px-4 border-b">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each filtered_users as user}
        <tr>
          <td class="py-2 px-4 border-b">{user.id}</td>
          <td class="py-2 px-4 border-b">{user.name}</td>
          <td class="py-2 px-4 border-b">{user.email}</td>
          <td class="py-2 px-4 border-b">{user.role}</td>
          <td class="py-2 px-4 border-b">{user.status}</td>
          <td class="py-2 px-4 border-b">
            <button 
              class="text-blue-600 hover:underline" 
              on:click={() => viewUser(user.id)}
              use:trigger
            >
              View
            </button>
            <button class="ml-2 text-red-600 hover:underline">Deactivate</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- User Details Drawer -->
<div
  use:content
  class="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out translate-x-full"
  class:translate-x-0={$open}
  aria-labelledby="drawer-title"
  role="dialog"
  aria-modal="true"
>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b">
      <h2 id="drawer-title" class="text-lg font-medium" use:title>
        {isLoading ? 'Loading...' : selectedUser?.name || 'User Details'}
      </h2>
      <button
        class="text-gray-500 hover:text-gray-700"
        use:close
        aria-label="Close drawer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
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
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      {#if isLoading}
        <div class="flex justify-center items-center h-40">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      {:else if error}
        <div class="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      {:else if selectedUser}
        <div class="space-y-6">
          <div class="flex items-center space-x-4">
            <div class="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
              {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 class="text-lg font-medium">{selectedUser.name}</h3>
              <p class="text-gray-500">{selectedUser.role}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-medium text-gray-500">Email</h4>
              <p>{selectedUser.email || 'N/A'}</p>
            </div>
            
            <div>
              <h4 class="text-sm font-medium text-gray-500">Phone</h4>
              <p>{selectedUser.phone || 'N/A'}</p>
            </div>
            
            <div>
              <h4 class="text-sm font-medium text-gray-500">Status</h4>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                    class:bg-green-100={selectedUser.status === 'active'} 
                    class:text-green-800={selectedUser.status === 'active'}
                    class:bg-red-100={selectedUser.status === 'inactive'}
                    class:text-red-800={selectedUser.status === 'inactive'}
                    class:bg-gray-100={!['active', 'inactive'].includes(selectedUser.status)}
                    class:text-gray-800={!['active', 'inactive'].includes(selectedUser.status)}>
                {selectedUser.status || 'N/A'}
              </span>
            </div>
            
            <div>
              <h4 class="text-sm font-medium text-gray-500">Member Since</h4>
              <p>{formatDate(selectedUser.createdAt)}</p>
            </div>
            
            {#if selectedUser.lastLoginAt}
              <div>
                <h4 class="text-sm font-medium text-gray-500">Last Login</h4>
                <p>{formatDate(selectedUser.lastLoginAt)}</p>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="p-4 border-t flex justify-end space-x-3">
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        use:close
      >
        Close
      </button>
      {#if selectedUser}
        <a
          href={`/admin/users/edit/${selectedUser.id}`}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Edit Profile
        </a>
      {/if}
    </div>
  </div>
</div>

<!-- Backdrop -->
{#if $open}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-40" on:click={close} />
{/if}
