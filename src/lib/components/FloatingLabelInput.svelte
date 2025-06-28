<script lang="ts">
// Define prop types
type InputProps = {
  id?: string
  label?: string
  type?: string
  value?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  maxLength?: number
  autocomplete?: string
  className?: string
  onInput?: (event: Event) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
}

// Props with defaults using runes
const props = $props()

// Provide defaults for props
const id = $derived(props.id || '')
const label = $derived(props.label || '')
const type = $derived(props.type || 'text')
const value = $derived(props.value || '')
const placeholder = $derived(props.placeholder || '')
const required = $derived(props.required || false)
const disabled = $derived(props.disabled || false)
const error = $derived(props.error || '')
const maxLength = $derived(props.maxLength || -1)
const autocomplete = $derived(props.autocomplete || 'off')
const className = $derived(props.className || '')
const onInput = $derived(props.onInput)
const onFocus = $derived(props.onFocus)
const onBlur = $derived(props.onBlur)

// Internal state
let isFocused = $state(false)
const hasValue = $derived(value !== '')

// Handle focus and blur events
function handleFocus(event: FocusEvent) {
  isFocused = true
  if (onFocus) onFocus(event)
}

function handleBlur(event: FocusEvent) {
  isFocused = false
  if (onBlur) onBlur(event)
}

function handleInput(event: Event) {
  if (onInput) onInput(event)
}
</script>

<div class={`floating-label-input relative ${className}`}>
  <input
    {id}
    {type}
    {placeholder}
    {required}
    {disabled}
    {autocomplete}
    value={value}
    maxlength={maxLength > 0 ? maxLength : undefined}
    class={`
      peer w-full px-4 py-2.5 pt-6 border rounded-lg outline-none transition-all duration-200
      ${error ? 'border-red-500' : 'border-gray-300'}
      ${isFocused ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}
      ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
    `}
    onfocus={handleFocus}
    onblur={handleBlur}
    oninput={handleInput}
  />
  <label
    for={id}
    class={`
      absolute left-4 transition-all duration-200
      ${hasValue || isFocused || placeholder ? 'text-xs top-2' : 'text-sm top-1/2 -translate-y-1/2'}
      ${disabled ? 'text-gray-400' : ''}
      ${error ? 'text-red-500' : ''}
      ${isFocused ? 'text-blue-500' : 'text-gray-500'}
      pointer-events-none
    `}
  >
    {label}{required ? ' *' : ''}
  </label>
  {#if error}
    <div class="text-red-500 text-xs mt-1">{error}</div>
  {/if}
  {#if maxLength > 0 && value.length > 0}
    <div class={`text-xs mt-1 text-right ${value.length === maxLength ? 'text-amber-500' : 'text-gray-400'}`}>
      {value.length}/{maxLength}
    </div>
  {/if}
</div>

<style>
  /* Ensure the component works correctly with focus-visible polyfills */
  .floating-label-input input:focus-visible {
    outline: none;
  }
</style>
