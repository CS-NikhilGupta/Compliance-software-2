import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'

// Dashboard pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ClientsPage } from '@/pages/clients/ClientsPage'
import { ClientDetailPage } from '@/pages/clients/ClientDetailPage'
import { EntitiesPage } from '@/pages/entities/EntitiesPage'
import { EntityDetailPage } from '@/pages/entities/EntityDetailPage'
import { TasksPage } from '@/pages/tasks/TasksPage'
import { TaskDetailPage } from '@/pages/tasks/TaskDetailPage'
import { CompliancePage } from '@/pages/compliance/CompliancePage'
import { DocumentsPage } from '@/pages/documents/DocumentsPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        
        <Route path="entities" element={<EntitiesPage />} />
        <Route path="entities/:id" element={<EntityDetailPage />} />
        
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        
        <Route path="compliance" element={<CompliancePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Redirect based on auth status */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/auth/login" replace />
          )
        }
      />
    </Routes>
  )
}

export default App
