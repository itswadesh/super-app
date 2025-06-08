import { writable } from 'svelte/store'

type User = {
  id: string
  name: string
  phone: string
  email?: string
  role?: 'user' | 'admin'
  board?: string
  class?: string
} | null

type UserStore = {
  isAuthenticated: boolean
  user: User
  token: string | null
}

function createUserStore() {
  // Initialize from localStorage if available
  let initialState: UserStore = {
    isAuthenticated: false,
    user: null,
    token: null,
  }

  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('superapp_user')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        initialState = {
          isAuthenticated: true,
          user: parsed.user,
          token: parsed.token,
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('superapp_user')
      }
    }
  }

  const { subscribe, set, update } = writable<UserStore>(initialState)

  return {
    subscribe,

    /**
     * Set user as logged in
     */
    login: (userData: { user: User; token: string }) => {
      const newState = {
        isAuthenticated: true,
        user: userData.user,
        token: userData.token,
      }
      set(newState)

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'superapp_user',
          JSON.stringify({
            user: userData.user,
            token: userData.token,
          }),
        )
      }
    },

    /**
     * Log user out
     */
    logout: () => {
      set({
        isAuthenticated: false,
        user: null,
        token: null,
      })

      // Remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('superapp_user')
      }
    },

    /**
     * Update user data
     */
    updateUser: (userData: Partial<User>) => {
      update((state) => {
        if (!state.user) return state

        const updatedUser = {
          ...state.user,
          ...userData,
        }

        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'superapp_user',
            JSON.stringify({
              user: updatedUser,
              token: state.token,
            }),
          )
        }

        return {
          ...state,
          user: updatedUser,
        }
      })
    },
  }
}

export const userStore = createUserStore()
