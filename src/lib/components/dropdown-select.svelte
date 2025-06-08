<script lang="ts">
// Svelte 5 runes syntax
export let id: string
export let label: string
export let options: { id: string; name: string }[]
export let value: string

export const placeholder = 'Select an option'
export const required = false
export const disabled = false
export const className = ''
export const onChange: (event: Event) => void = () => {}
</script>

<div>
  <label for={id} class="block text-sm font-medium text-gray-700">{label}</label>
  <div class="mt-1 relative">
    <select
      id={id}
      bind:value={value}
      class={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10 ${className}`}
      required={required}
      disabled={disabled}
    >
      <option value="" disabled>{placeholder}</option>
      {#each options as opt}
        <option value={opt.id}>{opt.name}</option>
      {/each}
    </select>
    <svg class="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
         fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
    </svg>
  </div>
</div>

<style>
  /* No additional styles, uses Tailwind classes */
</style>
