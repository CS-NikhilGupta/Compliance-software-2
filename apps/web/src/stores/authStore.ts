import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  tenantId: string
  tenantName: string
  roles: string[]
  isAdmin: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateProfile: (data: Partial<User>) => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  tenantName: string
  phone?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          
          const response = await api.post('/auth/login', {
            email,
            password,
          })

          const { user, token } = response.data.data
          
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })

          toast.success(`Welcome back, ${user.firstName}!`)
        } catch (error: any) {
          set({ isLoading: false })
          const message = error.response?.data?.error?.message || 'Login failed'
          toast.error(message)
          throw error
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true })
          
          const response = await api.post('/auth/register', data)
          
          const { user, token } = response.data.data
          
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })

          toast.success(`Welcome to Compliance SaaS, ${user.firstName}!`)
        } catch (error: any) {
          set({ isLoading: false })
          const message = error.response?.data?.error?.message || 'Registration failed'
          toast.error(message)
          throw error
        }
      },

      logout: () => {
        // Clear token from API headers
        delete api.defaults.headers.common['Authorization']
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })

        toast.success('Logged out successfully')
      },

      refreshToken: async () => {
        try {
          const { token } = get()
          if (!token) return

          const response = await api.post('/auth/refresh', {
            token,
          })

          const { user, token: newToken } = response.data.data
          
          // Update token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
          
          set({
            user,
            token: newToken,
            isAuthenticated: true,
          })
        } catch (error) {
          // If refresh fails, logout user
          get().logout()
        }
      },

      updateProfile: (data: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...data },
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set token in API headers when rehydrating
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },
    }
  )
)
