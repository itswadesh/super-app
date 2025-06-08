<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import { X } from '@lucide/svelte';

  interface FilterOption {
    id: string;
    name: string;
    options: string[];
  }

  interface FilterProps {
    filterOptions: FilterOption[];
    selectedFilters: Record<string, string[]>;
    onFilterChange: (filterId: string, value: string, checked: boolean) => void;
    children?: unknown;
  }

  const {
    filterOptions = [],
    selectedFilters = {},
    onFilterChange = () => {},
    children,
  } = $props<FilterProps>()

  let isOpen = $state(false);

  function handleClose() {
    isOpen = false;
  }

  function handleToggle() {
    isOpen = !isOpen;
  }

  function handleFilterClick(filterId: string, value: string, checked: boolean) {
    onFilterChange?.(filterId, value, checked);
  }

  function clearAllFilters() {
    Object.entries(selectedFilters).forEach(([filterId]) => {
      selectedFilters[filterId] = [];
      onFilterChange(filterId, '', false);
    });
  }
</script>

{#if children}
  {@render children?.()}
{/if}

<!-- Mobile filter dialog -->
{#if isOpen}
  <div 
    class="fixed inset-0 z-50 overflow-y-auto" 
    role="dialog" 
    aria-modal="true"
  >
    <div class="flex min-h-screen text-center md:hidden">
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        aria-hidden="true"
        onclick={handleClose}
      ></div>
      
      <div class="inline-block w-full h-full bg-white text-left align-bottom transform transition-all">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-semibold">Filters</h3>
          <Button 
            variant="ghost"
            size="icon"
            on:click={handleClose}
            class="h-8 w-8"
          >
            <X class="h-4 w-4" />
            <span class="sr-only">Close</span>
          </Button>
        </div>
        
        <div class="p-4 max-h-[70vh] overflow-y-auto">
          {#each filterOptions as filter}
            <div class="mb-6">
              <h4 class="text-sm font-medium mb-3">{filter.name}</h4>
              <div class="space-y-3">
                {#each filter.options as option}
                  <div class="flex items-center space-x-2">
                    <Checkbox
                      id={`${filter.id}-${option}`}
                      checked={selectedFilters[filter.id]?.includes(option) || false}
                      on:change={(e) => onFilterChange(filter.id, option, e.detail)}
                    />
                    <Label 
                      for={`${filter.id}-${option}`} 
                      class="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option}
                    </Label>
                  </div>
                {/each}
              </div>
              {#if filterOptions[filterOptions.length - 1] !== filter}
                <Separator class="my-4" />
              {/if}
            </div>
          {/each}
        </div>
        
        <div class="p-4 border-t flex justify-between">
          <Button 
            variant="ghost"
            on:click={clearAllFilters}
            class="text-destructive hover:text-destructive/90"
          >
            Clear all
          </Button>
          <Button
            on:click={handleClose}
          >
            Apply filters
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Desktop filters -->
<aside class="hidden md:block w-64 flex-shrink-0" aria-labelledby="filters-heading">
  <h3 id="filters-heading" class="sr-only">Filters</h3>
  
  <div class="space-y-6">
    {#each filterOptions as filter}
      <div>
        <h4 class="text-sm font-medium mb-3">{filter.name}</h4>
        <div class="space-y-3">
          {#each filter.options as option}
            <div class="flex items-center space-x-2">
              <Checkbox
                id={`desktop-${filter.id}-${option}`}
                checked={selectedFilters[filter.id]?.includes(option) || false}
                on:change={(e) => onFilterChange(filter.id, option, e.detail)}
              />
              <Label 
                for={`desktop-${filter.id}-${option}`}
                class="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option}
              </Label>
            </div>
          {/each}
        </div>
        {#if filterOptions[filterOptions.length - 1] !== filter}
          <Separator class="my-4" />
        {/if}
      </div>
    {/each}
  </div>
</aside>
