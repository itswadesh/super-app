<script lang="ts">
// Use let instead of const for bindable props
let {
  id,
  name,
  value = $bindable(''),
  options = [],
  label = '',
  required = false,
  disabled = false,
  error = false,
  className = '',
  onchange = () => {},
} = $props<{
  id: string
  name: string
  value?: string
  options: { value: string; label: string }[]
  label?: string
  required?: boolean
  disabled?: boolean
  error?: boolean | string
  className?: string
  onchange?: (e: Event) => void
}>()

const showError = $derived(!!error)
const inputId = $derived(id || name)

function handleChange(e: Event) {
  if (onchange) onchange(e)
}
</script>

<div class="mb-4 text-left">
  {#if label}
    <label for={inputId} class="block text-sm font-medium mb-1" class:text-gray-500={!showError} class:text-red-600={showError}>
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}
  
  <div class="relative">
    <select
      {id}
      {name}
      {required}
      {disabled}
      bind:value
      onchange={handleChange}
      class="w-full px-3 py-2 h-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10 {className}"
      class:border-red-500={showError}
      class:border-gray-300={!showError}
      class:bg-gray-50={disabled}
      class:text-gray-900={!disabled}
      class:text-gray-400={disabled}
      aria-invalid={showError}
      aria-describedby={showError ? `${inputId}-error` : undefined}
    >
      {#each options as option}
        <option value={option.value} selected={option.value === value}>
          {option.label}
        </option>
      {/each}
    </select>
    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </div>
  </div>
  
  {#if showError}
    <p id={`${inputId}-error`} class="mt-1 text-sm text-red-600">
      {typeof error === 'string' ? error : 'This field is required'}
    </p>
  {/if}
</div>
