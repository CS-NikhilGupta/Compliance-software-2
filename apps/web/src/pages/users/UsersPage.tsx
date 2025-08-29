import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { UserTable } from '@/components/users/UserTable'
import { InviteUserModal } from '@/components/users/InviteUserModal'
import { useAuthStore } from '@/stores/authStore'

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'USER', label: 'User' },
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const { user } = useAuthStore()

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['users', { search: searchTerm, role: roleFilter, isActive: statusFilter }],
    queryFn: () => apiClient.users.getAll({
      search: searchTerm,
      role: roleFilter || undefined,
      isActive: statusFilter ? statusFilter === 'true' : undefined,
    }),
  })

  const users = usersData?.data?.data?.users || []

  // Only show this page to admins
  if (!user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage team members and their access permissions
          </p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select
          options={roleOptions}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          placeholder="Filter by role"
        />
        
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="Filter by status"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <UserTable users={users} onRefetch={refetch} />
      )}

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          setIsInviteModalOpen(false)
          refetch()
        }}
      />
    </div>
  )
}
