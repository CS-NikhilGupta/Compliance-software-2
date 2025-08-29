import { useState } from 'react'
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import { formatDate, getInitials, cn } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

interface UserTableProps {
  users: User[]
  onRefetch: () => void
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  USER: 'User',
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  USER: 'bg-gray-100 text-gray-800',
}

export function UserTable({ users, onRefetch }: UserTableProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setProcessingIds(prev => new Set(prev).add(userId))
      await apiClient.users.update(userId, { isActive: !currentStatus })
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      onRefetch()
    } catch (error) {
      toast.error('Failed to update user status')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      setProcessingIds(prev => new Set(prev).add(userId))
      await apiClient.users.delete(userId)
      toast.success('User deleted successfully')
      onRefetch()
    } catch (error) {
      toast.error('Failed to delete user')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by inviting team members.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {getInitials(user.firstName, user.lastName)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  roleColors[user.role] || 'bg-gray-100 text-gray-800'
                )}>
                  {roleLabels[user.role] || user.role}
                </span>
              </TableCell>
              <TableCell>
                <button
                  onClick={() => handleToggleStatus(user.id, user.isActive)}
                  disabled={processingIds.has(user.id)}
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
                    user.isActive
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200',
                    processingIds.has(user.id) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </button>
              </TableCell>
              <TableCell>
                {user.lastLoginAt ? (
                  <div className="text-sm text-gray-900">
                    {formatDate(user.lastLoginAt)}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Never</span>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </div>
              </TableCell>
              <TableCell>
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={cn(
                              active ? 'bg-gray-100' : '',
                              'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                            )}
                          >
                            <EyeIcon className="mr-3 h-4 w-4" />
                            View Profile
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={cn(
                              active ? 'bg-gray-100' : '',
                              'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                            )}
                          >
                            <PencilIcon className="mr-3 h-4 w-4" />
                            Edit User
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={processingIds.has(user.id)}
                            className={cn(
                              active ? 'bg-gray-100' : '',
                              'flex w-full items-center px-4 py-2 text-sm text-red-700 disabled:opacity-50'
                            )}
                          >
                            <TrashIcon className="mr-3 h-4 w-4" />
                            {processingIds.has(user.id) ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
