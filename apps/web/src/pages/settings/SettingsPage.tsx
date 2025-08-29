import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function SettingsPage() {
  const { user, updateProfile, isLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch,
  } = useForm<PasswordFormData>()

  const newPassword = watch('newPassword')

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setIsUpdatingPassword(true)
      // This would typically call an API endpoint to change password
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Password updated successfully')
      resetPassword()
    } catch (error) {
      toast.error('Failed to update password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile' },
    { id: 'security', name: 'Security' },
    { id: 'notifications', name: 'Notifications' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl">
        {activeTab === 'profile' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Profile Information</h3>
              <p className="card-description">
                Update your personal information and contact details
              </p>
            </div>
            <div className="card-content">
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    {...registerProfile('firstName', {
                      required: 'First name is required',
                    })}
                    error={profileErrors.firstName?.message}
                  />
                  <Input
                    label="Last Name"
                    {...registerProfile('lastName', {
                      required: 'Last name is required',
                    })}
                    error={profileErrors.lastName?.message}
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  {...registerProfile('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  error={profileErrors.email?.message}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  {...registerProfile('phone')}
                  error={profileErrors.phone?.message}
                />

                <div className="flex justify-end">
                  <Button type="submit" loading={isLoading}>
                    Update Profile
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Change Password</h3>
              <p className="card-description">
                Update your password to keep your account secure
              </p>
            </div>
            <div className="card-content">
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                <Input
                  label="Current Password"
                  type="password"
                  {...registerPassword('currentPassword', {
                    required: 'Current password is required',
                  })}
                  error={passwordErrors.currentPassword?.message}
                />

                <Input
                  label="New Password"
                  type="password"
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  error={passwordErrors.newPassword?.message}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  {...registerPassword('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: (value) =>
                      value === newPassword || 'Passwords do not match',
                  })}
                  error={passwordErrors.confirmPassword?.message}
                />

                <div className="flex justify-end">
                  <Button type="submit" loading={isUpdatingPassword}>
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Notification Preferences</h3>
              <p className="card-description">
                Choose how you want to receive notifications
              </p>
            </div>
            <div className="card-content">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    defaultChecked
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Task Reminders</h4>
                    <p className="text-sm text-gray-500">Get reminded about upcoming tasks</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    defaultChecked
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Overdue Alerts</h4>
                    <p className="text-sm text-gray-500">Get alerted when tasks become overdue</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    defaultChecked
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Weekly Digest</h4>
                    <p className="text-sm text-gray-500">Receive a weekly summary of activities</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex justify-end">
                  <Button>Save Preferences</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
