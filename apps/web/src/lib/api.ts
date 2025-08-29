import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add request ID for tracing
    config.headers['X-Request-ID'] = crypto.randomUUID()
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          if (window.location.pathname !== '/auth/login') {
            toast.error('Session expired. Please login again.')
            // Clear auth state and redirect
            localStorage.removeItem('auth-storage')
            window.location.href = '/auth/login'
          }
          break
          
        case 403:
          toast.error('You do not have permission to perform this action')
          break
          
        case 404:
          toast.error('Resource not found')
          break
          
        case 422:
          // Validation errors
          if (data.error?.details) {
            const validationErrors = Object.values(data.error.details).flat()
            validationErrors.forEach((error: any) => toast.error(error))
          } else {
            toast.error(data.error?.message || 'Validation failed')
          }
          break
          
        case 429:
          toast.error('Too many requests. Please try again later.')
          break
          
        case 500:
          toast.error('Server error. Please try again later.')
          break
          
        default:
          toast.error(data.error?.message || 'An error occurred')
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.')
    } else {
      // Other error
      toast.error('An unexpected error occurred')
    }
    
    return Promise.reject(error)
  }
)

// API helper functions
export const apiClient = {
  // Auth
  auth: {
    login: (data: { email: string; password: string }) =>
      api.post('/auth/login', data),
    register: (data: any) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    refreshToken: (token: string) => api.post('/auth/refresh', { token }),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data: { token: string; password: string }) =>
      api.post('/auth/reset-password', data),
    sendOTP: (email: string) => api.post('/auth/send-otp', { email }),
    verifyOTP: (data: { email: string; otp: string }) =>
      api.post('/auth/verify-otp', data),
  },

  // Users
  users: {
    getAll: (params?: any) => api.get('/users', { params }),
    getById: (id: string) => api.get(`/users/${id}`),
    create: (data: any) => api.post('/users', data),
    update: (id: string, data: any) => api.patch(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
    invite: (data: { email: string; roleId: string }) =>
      api.post('/users/invite', data),
    getRoles: () => api.get('/users/roles'),
  },

  // Tenants
  tenants: {
    getCurrent: () => api.get('/tenants/current'),
    update: (data: any) => api.patch('/tenants/current', data),
    getSettings: () => api.get('/tenants/settings'),
    updateSettings: (data: any) => api.patch('/tenants/settings', data),
    getUsage: () => api.get('/tenants/usage'),
  },

  // Clients
  clients: {
    getAll: (params?: any) => api.get('/clients', { params }),
    getById: (id: string) => api.get(`/clients/${id}`),
    create: (data: any) => api.post('/clients', data),
    update: (id: string, data: any) => api.patch(`/clients/${id}`, data),
    delete: (id: string) => api.delete(`/clients/${id}`),
    getEntities: (id: string, params?: any) =>
      api.get(`/clients/${id}/entities`, { params }),
    getTasks: (id: string, params?: any) =>
      api.get(`/clients/${id}/tasks`, { params }),
    getDocuments: (id: string, params?: any) =>
      api.get(`/clients/${id}/documents`, { params }),
  },

  // Entities
  entities: {
    getAll: (params?: any) => api.get('/entities', { params }),
    getById: (id: string) => api.get(`/entities/${id}`),
    create: (data: any) => api.post('/entities', data),
    update: (id: string, data: any) => api.patch(`/entities/${id}`, data),
    delete: (id: string) => api.delete(`/entities/${id}`),
    getCompliances: (id: string) => api.get(`/entities/${id}/compliances`),
    getTasks: (id: string, params?: any) =>
      api.get(`/entities/${id}/tasks`, { params }),
  },

  // Tasks
  tasks: {
    getAll: (params?: any) => api.get('/tasks', { params }),
    getById: (id: string) => api.get(`/tasks/${id}`),
    create: (data: any) => api.post('/tasks', data),
    update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
    delete: (id: string) => api.delete(`/tasks/${id}`),
    assign: (id: string, assigneeId: string) =>
      api.patch(`/tasks/${id}/assign`, { assigneeId }),
    addComment: (id: string, data: { content: string; mentions?: string[] }) =>
      api.post(`/tasks/${id}/comments`, data),
    addChecklist: (id: string, data: { title: string; description?: string }) =>
      api.post(`/tasks/${id}/checklist`, data),
    generate: (data: { entityId: string; year?: number; complianceIds?: string[] }) =>
      api.post('/tasks/generate', data),
  },

  // Compliance
  compliance: {
    getAll: (params?: any) => api.get('/compliances', { params }),
    getById: (id: string) => api.get(`/compliances/${id}`),
    create: (data: any) => api.post('/compliances', data),
    update: (id: string, data: any) => api.patch(`/compliances/${id}`, data),
    getCategories: () => api.get('/compliances/categories'),
    getApplicable: (entityId: string) =>
      api.get(`/compliances/applicable/${entityId}`),
  },

  // Documents
  documents: {
    getAll: (params?: any) => api.get('/documents', { params }),
    getById: (id: string) => api.get(`/documents/${id}`),
    upload: (formData: FormData) =>
      api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    update: (id: string, data: any) => api.patch(`/documents/${id}`, data),
    delete: (id: string) => api.delete(`/documents/${id}`),
    download: (id: string) => api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    }),
  },

  // Notifications
  notifications: {
    getAll: (params?: any) => api.get('/notifications', { params }),
    getById: (id: string) => api.get(`/notifications/${id}`),
    create: (data: any) => api.post('/notifications', data),
    markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/mark-all-read'),
    delete: (id: string) => api.delete(`/notifications/${id}`),
  },

  // Reports
  reports: {
    getDashboard: () => api.get('/reports/dashboard'),
    getTasks: (params?: any) => api.get('/reports/tasks', { params }),
    getCompliance: (params?: any) => api.get('/reports/compliance', { params }),
    getClients: (params?: any) => api.get('/reports/clients', { params }),
    getPerformance: (params?: any) => api.get('/reports/performance', { params }),
  },

  // Health
  health: {
    basic: () => api.get('/health'),
    detailed: () => api.get('/health/detailed'),
    ready: () => api.get('/health/ready'),
    live: () => api.get('/health/live'),
  },
}
