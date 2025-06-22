<script lang="ts">
  import { cn } from '$lib/utils';
  
  // Props
  export let class: string = '';
  export let disabled: boolean = false;
  export let open: boolean = false;
  export let value: string | undefined = undefined;
  
  // Events
  export let onValueChange: (value: string) => void = () => {};
  
  // Handle value change
  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onValueChange(target.value);
  }
</script>

<div class={cn('relative w-full', class)}>
  <select
    class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    {value}
    on:change={handleChange}
    {disabled}
  >
    <slot />
  </select>
  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4 opacity-50"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </div>
</div>

<!-- Trigger is handled by the root select element -->

<!-- Content is handled by the native select element -->

<option value={value} {disabled}>
  <slot />
</option>

<!-- Separator and arrow are not needed for native select -->
