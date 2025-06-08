import { writable } from 'svelte/store'

type LoginModalOptions = {
  redirectUrl?: string
  // For payment/purchase flows
  purchaseInfo?: {
    board: string
    price: string
  }
}

function createLoginModalStore() {
  const { subscribe, set, update } = writable({
    isOpen: false,
    redirectUrl: '/',
    purchaseInfo: null as { board: string; price: string } | null,
  })

  return {
    subscribe,
    /**
     * Open the login modal
     * @param options Configuration options for the login modal
     */
    open: (options: LoginModalOptions = {}) => {
      update((state) => ({
        ...state,
        isOpen: true,
        redirectUrl: options.redirectUrl || '/',
        purchaseInfo: options.purchaseInfo || null,
      }))
    },
    /**
     * Close the login modal
     */
    close: () => {
      update((state) => ({ ...state, isOpen: false }))
    },
  }
}

export const loginModal = createLoginModalStore()
