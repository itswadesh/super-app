<script lang="ts">
import { loginModal } from '$lib/stores/loginModal'

// Define types for props
type Variant = 'primary' | 'secondary' | 'text' | 'outline'
type Size = 'sm' | 'md' | 'lg'
type PurchaseInfo = { board: string; price: string } | undefined

// Define props using $props()
const {
  buttonText = 'Log In',
  variant = 'primary' as Variant,
  size = 'md' as Size,
  fullWidth = false,
  redirectUrl = undefined as string | undefined,
  purchaseInfo = undefined as PurchaseInfo,
  onclick,
} = $props()

// Styles based on variant
const variantStyles = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent',
  secondary: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-transparent',
  outline: 'bg-white hover:bg-gray-50 text-indigo-600 border-indigo-600',
  text: 'bg-transparent hover:bg-gray-50 text-indigo-600 border-transparent',
}

// Sizes
const sizeStyles = {
  sm: 'py-1 px-3 text-sm',
  md: 'py-2 px-4 text-sm',
  lg: 'py-3 px-6 text-base',
}

// Compute class string using $derived
const buttonClass = $derived(
  `${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`
)

function handleClick() {
  onclick?.()
  loginModal.open({ redirectUrl, purchaseInfo })
}
</script>

<button
  type="button"
  class={buttonClass}
  onclick={handleClick}
>
  {buttonText}
</button>
