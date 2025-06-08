<script lang="ts">
// Define prop types
type ButtonProps = {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  icon?: any
  iconPosition?: 'left' | 'right'
  className?: string
  onClick?: (event: MouseEvent) => void
  children?: string
}

// Props with defaults using runes
const props = $props()

// Extract props with defaults
const type = $derived(props.type || 'button')
const variant = $derived(props.variant || 'primary')
const size = $derived(props.size || 'md')
const fullWidth = $derived(props.fullWidth || false)
const disabled = $derived(props.disabled || false)
const loading = $derived(props.loading || false)
const icon = $derived(props.icon || null)
const iconPosition = $derived(props.iconPosition || 'left')
const className = $derived(props.className || '')
const onClick = $derived(props.onClick)

// Button variants
const variantClasses: Record<string, string> = {
  primary: 'bg-blue-600/85 hover:bg-blue-700/90 text-white border-blue-400',
  secondary: 'bg-gray-200/85 hover:bg-gray-300/90 text-gray-800 border-gray-300',
  danger: 'bg-red-500/85 hover:bg-red-600/90 text-white border-red-400',
  success: 'bg-green-500/85 hover:bg-green-600/90 text-white border-green-400',
  ghost: 'bg-transparent hover:bg-gray-100/50 text-gray-700 border-transparent',
}

// Button sizes
const sizeClasses: Record<string, string> = {
  sm: 'py-1.5 px-3 text-xs',
  md: 'py-2 px-4 text-sm',
  lg: 'py-2.5 px-5 text-base',
}

// Handle click
function handleClick(event: MouseEvent) {
  if (disabled || loading) return
  if (onClick) onClick(event)
}
</script>

<button
  {type}
  class={`
    relative flex items-center justify-center rounded-lg font-medium transition-all duration-200
    ${sizeClasses[size] || sizeClasses.md}
    ${variantClasses[variant] || variantClasses.primary}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${loading ? 'cursor-wait' : ''}
    backdrop-blur-md backdrop-saturate-150 border shadow-sm
    ${className}
  `}
  disabled={disabled || loading}
  onclick={handleClick}
>
  <span class="frosted-glass-effect"></span>
  
  {#if loading}
    <span class="absolute inset-0 flex items-center justify-center">
      <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>
    <span class="opacity-0">{props.children || ''}</span>
  {:else}
    {#if icon && iconPosition === 'left'}
      <span class="mr-2">{icon}</span>
    {/if}
    
    <span>{props.children || ''}</span>
    
    {#if icon && iconPosition === 'right'}
      <span class="ml-2">{icon}</span>
    {/if}
  {/if}
</button>

<style>
  /* Frosted glass effect */
  .frosted-glass-effect {
    position: absolute;
    inset: 0;
    backdrop-filter: blur(8px);
    border-radius: inherit;
    opacity: 0.8;
    pointer-events: none;
  }
  
  /* Subtle hover animation */
  button:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  button:not(:disabled):active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>
