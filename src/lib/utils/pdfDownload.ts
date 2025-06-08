import { goto } from '$app/navigation'
import { loginModal } from '$lib/stores/loginModal'
import { userStore } from '$lib/stores/userStore'
import { toast } from './toast'

type DownloadOptions = {
  resourceId: string
  resourceType: string // 'note', 'quiz', etc.
  title: string
  price?: number // Optional for free resources
}

/**
 * Handle PDF download with authentication and subscription checks
 * This implements a complete flow for downloading PDFs:
 * 1. Check if user is authenticated, if not open login modal
 * 2. After login, check if user has an active subscription
 * 3. If no subscription, redirect to payment page
 * 4. If has subscription, initiate download
 */
export async function downloadPdf(options: DownloadOptions): Promise<void> {
  // Extract user from store
  let currentUser = null
  userStore.subscribe((state) => (currentUser = state.user))()

  // Step 1: Check if user is authenticated
  if (!currentUser) {
    console.log('User not authenticated, opening login modal')

    // Set up a redirect to the payment page after login if needed
    loginModal.open({
      redirectUrl: `/download?id=${options.resourceId}&type=${options.resourceType}`,
      purchaseInfo: {
        board: options.resourceType,
        price: options.price?.toString() || '0',
      },
    })

    // The login modal will handle the redirect after login
    return
  }

  // Step 2: Check if user has an active subscription
  console.log('Checking subscription status')
  const hasSubscription = await subscriptionStore.checkSubscription()

  // Step 3: If no subscription, redirect to payment page
  if (!hasSubscription) {
    console.log('No active subscription, redirecting to payment page')
    toast.info('You need a subscription to download this resource')

    goto(
      `/payment?resource=${options.resourceId}&type=${options.resourceType}&price=${options.price || '299'}`
    )
    return
  }

  // Step 4: User is authenticated and has subscription, proceed with download
  console.log('Starting PDF download')
  toast.success('Download started')

  try {
    // Actual PDF download implementation
    const response = await fetch(`/api/${options.resourceType}/${options.resourceId}/download`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Download failed')
    }

    // Convert response to blob and create download link
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `${options.title || 'document'}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast.success('Download complete!')
  } catch (error) {
    console.error('Error downloading PDF:', error)
    toast.error('Failed to download. Please try again.')
  }
}
