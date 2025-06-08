<script lang="ts">
import { createEventDispatcher } from 'svelte'

// Event dispatcher for component events
const dispatch = createEventDispatcher<{
  input: string
  focus: void
  blur: void
  init: HTMLInputElement | HTMLTextAreaElement
}>()

// Props using Svelte 5 runes
const {
  id = '',
  name = '',
  value = '',
  label = '',
  type = 'text',
  required = false,
  placeholder = '',
  disabled = false,
  rows = 3, // for textarea
} = $props()

// Track if the input is focused or has content
let isFocused = $state(false)
let hasContent = $state(!!value)
let inputElement: HTMLInputElement | HTMLTextAreaElement

// Check if the component should render as a textarea
const isTextarea = $derived(type === 'textarea')

// Handle input changes
function handleInput(e: Event) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  hasContent = !!target.value
  dispatch('input', target.value)
}

// Handle focus
function handleFocus() {
  isFocused = true
  dispatch('focus')
}

// Handle blur
function handleBlur() {
  isFocused = false
  dispatch('blur')
}

// Get element reference to expose to parent
function setInputRef(node: HTMLInputElement | HTMLTextAreaElement) {
  inputElement = node
  dispatch('init', node)
  return {
    destroy() {
      // Cleanup if needed
    },
  }
}
</script>

<div class="relative mb-4">
  <div class="relative">
    {#if isTextarea}
      <textarea
        {id}
        {name}
        {placeholder}
        {required}
        {disabled}
        {rows}
        value={value}
        class="peer w-full px-3 pt-5 pb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        oninput={handleInput}
        onfocus={handleFocus}
        onblur={handleBlur}
        use:setInputRef
      ></textarea>
    {:else}
      <input
        {id}
        {name}
        {type}
        {placeholder}
        {required}
        {disabled}
        value={value}
        class="peer w-full px-3 pt-5 pb-2 h-14 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        oninput={handleInput}
        onfocus={handleFocus}
        onblur={handleBlur}
        use:setInputRef
      />
    {/if}
    
    <label
      for={id}
      class="absolute left-3 transition-all duration-200 pointer-events-none text-gray-500"
      class:transform={true}
      class:scale-75={isFocused || hasContent}
      class:translate-y-[-16px]={isFocused || hasContent}
      class:translate-y-[8px]={!isFocused && !hasContent}
    >
      {label}{required ? ' *' : ''}
    </label>
  </div>
</div>
