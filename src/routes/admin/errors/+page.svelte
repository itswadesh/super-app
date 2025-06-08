<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
    import { errorService } from '$lib/services/error-service';
  
  const props = $props<{data: PageData}>();
  
  // Define interfaces for error log objects
  interface ErrorLog {
    id: string;
    fingerprint: string;
    source: string;
    message: string;
    details: string | null;
    occurrences: number;
    firstSeen: string;
    lastSeen: string;
    isViewed: boolean;
    isIgnored: boolean;
    ignoredReason?: string | null;
  }
  
  // Using Svelte 5 runes syntax
  let errors = $state<ErrorLog[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let sortField = $state('lastSeen');
  let sortDirection = $state('desc');
  const searchTerm = $state('');
  let activeTab = $state('active'); // 'active' or 'ignored'
  
  // For ignoring errors
  let isIgnoreDialogOpen = $state(false);
  let selectedErrorId = $state<string | null>(null);
  let ignoreReason = $state('');
  
  // Derived state using runes for filtered and sorted errors
  const sortedErrors = $derived(() => {
    // First filter by active/ignored tab
    const tabFiltered = errors.filter(err => {
      if (activeTab === 'active') {
        return !err.isIgnored;
      } else {
        return err.isIgnored;
      }
    });
    
    // Then filter based on search term if present
    const filtered = searchTerm
      ? tabFiltered.filter(err => 
          err.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
          err.message.toLowerCase().includes(searchTerm.toLowerCase()))
      : tabFiltered;
    
    // Then sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'occurrences') {
        comparison = a.occurrences - b.occurrences;
      } else if (sortField === 'source') {
        comparison = a.source.localeCompare(b.source);
      } else if (sortField === 'message') {
        comparison = a.message.localeCompare(b.message);
      } else if (sortField === 'firstSeen') {
        comparison = new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime();
      } else if (sortField === 'lastSeen') {
        comparison = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  });
  
  // Derived from page data using runes
  const isAuthorized = true // $derived(page.data?.user?.role === 'admin');
  
  // Change sorting
  function sortBy(field: string) {
    if (sortField === field) {
      // Toggle direction if same field
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New field, default to descending
      sortField = field;
      sortDirection = 'desc';
    }
  }
  
  // Format date for display
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  // Delete an error log
  async function deleteError(id: string) {
    try {
      const response = await errorService.deleteError(id);
      
      if (response.ok) {
        // Remove from local array
        errors = errors.filter(err => err.id !== id);
      } else {
        throw new Error('Failed to delete error');
      }
    } catch (err) {
      error = 'Error deleting log';
    }
  }
  
  // Load error logs from API
  async function loadErrors() {
    isLoading = true;
    error = null;
    
    try {
      const response = await errorService.getErrors();
      
      if (!response.ok) {
        throw new Error('Failed to fetch error logs');
      }
      
      const data = await response.json();
      errors = data.errors;
    } catch (err) {
      error = 'Error loading logs';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
  
  // Clear all error logs
  async function clearAllErrors() {
    if (!confirm('Are you sure you want to clear all error logs?')) {
      return;
    }
    
    try {
      const response = await errorService.createOrUpdateError();
      
      if (response.ok) {
        errors = [];
      } else {
        throw new Error('Failed to clear errors');
      }
    } catch (err) {
      error = 'Error clearing logs';
    }
  }
  
  // Functions for error status management
  async function markAsViewed(errorId: string, isViewed = true) {
    try {
      const response = await errorService.updateErrorById(errorId);
      if (response.ok) {
        // Update local state
        errors = errors.map(err => 
          err.id === errorId ? { ...err, isViewed } : err
        );
      }
      
      if (response.ok) {
        // Update local state
        errors = errors.map(err => 
          err.id === errorId ? { ...err, isViewed } : err
        );
      }
    } catch (err) {
      error = 'Failed to update error status';
    }
  }
  
  async function ignoreError() {
    if (!selectedErrorId) return;
    
    try {
      const response = await errorService.getErrorById(selectedErrorId);
      if (response.ok) {
        // Update local state
        errors = errors.map(err => 
          err.id === selectedErrorId ? { 
            ...err, 
            isIgnored: true,
          ignoredReason: ignoreReason.trim() || 'No reason provided'
        })
      
      if (response.ok) {
        // Update local state
        errors = errors.map(err => 
          err.id === selectedErrorId ? { 
            ...err, 
            isIgnored: true,
            ignoredReason: ignoreReason.trim() || 'No reason provided'
          } : err
        );
        
        // Close dialog and reset
        closeIgnoreDialog();
      }
    } catch (err) 
      error = 'Failed to ignore error';
  }
  
  function openIgnoreDialog(errorId: string) {
    selectedErrorId = errorId;
    ignoreReason = '';
    isIgnoreDialogOpen = true;
  }
  
  function closeIgnoreDialog() {
    isIgnoreDialogOpen = false;
    selectedErrorId = null;
    ignoreReason = '';
  }
  
  // Load errors for the active tab
  async function loadErrorsForTab() {
    isLoading = true;
    error = null;
    
    try {
      // Use errorService to load errors for the active tab
      try {
        const result = await errorService.getErrorsByStatus(activeTab === 'ignored');
        errors = result.errors || [];
      } catch (err) {
        throw new Error('Failed to fetch error logs');
      }
    } catch (err) {
      error = 'Error loading logs';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
  
  // When tab changes, load appropriate errors
  function changeTab(tab: 'active' | 'ignored') {
    if (activeTab !== tab) {
      activeTab = tab;
      loadErrorsForTab();
    }
  }
  
  onMount(() => {
    if (isAuthorized) {
      loadErrorsForTab();
    }
  });
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-6">Error Logs</h1>
  
  {#if !isAuthorized}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>You must be an admin to view this page.</p>
    </div>
  {:else if isLoading}
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{error}</p>
      <button 
        class="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700" 
        onclick={() => loadErrorsForTab()}
      >
        Retry
      </button>
    </div>
  {:else}
    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200">
      <nav class="flex -mb-px" aria-label="Tabs">
        <button
          class="mr-2 py-2 px-4 {activeTab === 'active' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          onclick={() => changeTab('active')}
        >
          Active Errors
        </button>
        <button
          class="py-2 px-4 {activeTab === 'ignored' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
          onclick={() => changeTab('ignored')}
        >
          Ignored Errors
        </button>
      </nav>
    </div>
    
    <!-- Controls -->
    <div class="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
      <div class="w-full md:w-64">
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Search errors..."
          class="px-4 py-2 border rounded w-full"
        />
      </div>
      
      <div class="flex space-x-2">
        <button 
          class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onclick={() => loadErrorsForTab()}
        >
          Refresh
        </button>
        
        <button 
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onclick={() => clearAllErrors()}
        >
          Clear All
        </button>
      </div>
    </div>
    
    {#if errors.length === 0}
      <div class="bg-gray-100 rounded p-8 text-center">
        <p class="text-gray-600">No errors have been logged in this category.</p>
      </div>
    {:else}
      <!-- Error table -->
      <div class="overflow-x-auto bg-white rounded shadow">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onclick={() => sortBy('source')}
              >
                Source
                {#if sortField === 'source'}
                  <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onclick={() => sortBy('message')}
              >
                Message
                {#if sortField === 'message'}
                  <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onclick={() => sortBy('occurrences')}
              >
                Count
                {#if sortField === 'occurrences'}
                  <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onclick={() => sortBy('lastSeen')}
              >
                Last Seen
                {#if sortField === 'lastSeen'}
                  <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each sortedErrors as errorLog (errorLog.id)}
              <tr class="hover:bg-gray-50 {errorLog.isViewed ? 'bg-gray-50 text-gray-400' : ''}">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium {errorLog.isViewed ? 'text-gray-500' : 'text-gray-900'}">
                  {errorLog.source}
                  {#if errorLog.isViewed}
                    <span class="ml-2 text-xs text-gray-400">(viewed)</span>
                  {/if}
                </td>
                <td class="px-6 py-4 text-sm {errorLog.isViewed ? 'text-gray-400' : 'text-gray-500'}">
                  <div class="truncate max-w-md">{errorLog.message}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {errorLog.isViewed ? 'bg-gray-100 text-gray-600' : 'bg-indigo-100 text-indigo-800'}">
                    {errorLog.occurrences}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm {errorLog.isViewed ? 'text-gray-400' : 'text-gray-500'}">
                  <div title={`First seen: ${formatDate(errorLog.firstSeen)}`}>
                    {formatDate(errorLog.lastSeen)}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    {#if activeTab === 'active'}
                      <!-- Mark as viewed/unviewed -->
                      <button 
                        title={errorLog.isViewed ? 'Mark as unviewed' : 'Mark as viewed'}
                        class="text-gray-500 hover:text-indigo-600" 
                        onclick={() => markAsViewed(errorLog.id, !errorLog.isViewed)}
                      >
                        {errorLog.isViewed ? '👁️' : '👁️‍🗨️'}
                      </button>
                      
                      <!-- Ignore button -->
                      <button 
                        title="Ignore this error"
                        class="text-yellow-500 hover:text-yellow-600" 
                        onclick={() => openIgnoreDialog(errorLog.id)}
                      >
                        🚫
                      </button>
                    {:else if activeTab === 'ignored' && errorLog.ignoredReason}
                      <span class="text-gray-500 text-xs italic" title={errorLog.ignoredReason}>
                        Reason: {errorLog.ignoredReason.length > 20 ? errorLog.ignoredReason.substring(0, 20) + '...' : errorLog.ignoredReason}
                      </span>
                    {/if}
                    
                    <!-- Delete button -->
                    <button 
                      title="Delete this error"
                      class="text-red-600 hover:text-red-900" 
                      onclick={() => deleteError(errorLog.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
              
              <!-- Details row (expandable) -->
              {#if errorLog.details}
                <tr class="{errorLog.isViewed ? 'bg-gray-50' : 'bg-gray-100'}">
                  <td colspan="5" class="px-6 py-4 text-sm text-gray-500">
                    <details>
                      <summary class="cursor-pointer font-medium {errorLog.isViewed ? 'text-gray-400' : 'text-indigo-600'}">
                        Error Details
                      </summary>
                      <pre class="mt-2 p-3 bg-gray-100 rounded overflow-x-auto {errorLog.isViewed ? 'text-gray-400' : ''}">{errorLog.details}</pre>
                    </details>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>

<!-- Ignore Error Dialog -->
{#if isIgnoreDialogOpen}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-6 max-w-md w-full">
    <h2 class="text-xl font-bold mb-4">Ignore Error</h2>
    <p class="mb-4 text-gray-600">Add a reason why you're ignoring this error (optional):</p>
    
    <textarea
      bind:value={ignoreReason}
      class="w-full p-2 border rounded mb-4 h-24"
      placeholder="Reason for ignoring..."
    ></textarea>
    
    <div class="flex justify-end space-x-2">
      <button
        class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        onclick={closeIgnoreDialog}
      >
        Cancel
      </button>
      <button
        class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        onclick={ignoreError}
      >
        Ignore Error
      </button>
    </div>
  </div>
</div>
{/if}
