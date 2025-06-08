/**
 * A toast utility that provides a consistent API for showing toast notifications.
 */

interface ToastOptions {
  duration?: number
  id?: string
  title?: string
}

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

declare global {
  interface Window {
    toastHelpers?: {
      addToast: (options: { type: ToastType; message: string; title?: string; duration?: number }) => string
      removeToast: (id: string) => void
      updateToast: (id: string, options: { type?: ToastType; message?: string; title?: string }) => void
    }
  }
}

// Type guard to ensure toast helpers are available
function isToastAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.toastHelpers
}

export const toast = {
  /**
   * Show a success toast notification
   */
  success: (message: string, options?: ToastOptions) => {
    if (!isToastAvailable()) {
      console.warn('Toast provider not initialized yet')
      return ''
    }
    return window.toastHelpers!.addToast({
      type: 'success',
      message,
      title: options?.title,
      duration: options?.duration,
    })
  },

  /**
   * Show an error toast notification
   */
  error: (message: string, options?: ToastOptions) => {
    if (!isToastAvailable()) {
      console.warn('Toast provider not initialized yet')
      return ''
    }
    return window.toastHelpers!.addToast({
      type: 'error',
      message,
      title: options?.title,
      duration: options?.duration,
    })
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string, options?: ToastOptions) => {
    if (!isToastAvailable()) {
      console.warn('Toast provider not initialized yet')
      return ''
    }
    return window.toastHelpers!.addToast({
      type: 'warning',
      message,
      title: options?.title,
      duration: options?.duration,
    })
  },

  /**
   * Show an info toast notification
   */
  info: (message: string, options?: ToastOptions) => {
    if (!isToastAvailable()) {
      console.warn('Toast provider not initialized yet')
      return ''
    }
    return window.toastHelpers!.addToast({
      type: 'info',
      message,
      title: options?.title,
      duration: options?.duration,
    })
  },

  /**
   * Show a loading toast notification that can be updated later
   */
  loading: (message: string, options?: ToastOptions) => {
    if (!isToastAvailable()) {
      console.warn('Toast provider not initialized yet')
      return ''
    }
    return window.toastHelpers!.addToast({
      type: 'loading',
      message,
      title: options?.title,
      duration: options?.duration || Number.POSITIVE_INFINITY,
    })
  },

  /**
   * Dismiss a specific toast by ID or all toasts if no ID is provided
   */
  dismiss: (toastId?: string) => {
    if (!isToastAvailable() || !toastId) return
    window.toastHelpers!.removeToast(toastId)
  },
}
