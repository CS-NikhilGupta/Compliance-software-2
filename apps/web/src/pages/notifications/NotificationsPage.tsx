import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { NotificationList } from '@/components/notifications/NotificationList'
import toast from 'react-hot-toast'

const statusOptions = [
  { value: '', label: 'All Notifications' },
  { value: 'false', label: 'Unread' },
  { value: 'true', label: 'Read' },
]

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'TASK_ASSIGNED', label: 'Task Assigned' },
  { value: 'TASK_DUE', label: 'Task Due' },
  { value: 'TASK_OVERDUE', label: 'Task Overdue' },
  { value: 'TASK_COMPLETED', label: 'Task Completed' },
  { value: 'MENTION', label: 'Mention' },
  { value: 'REMINDER', label: 'Reminder' },
]

export function NotificationsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const queryClient = useQueryClient()

  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['notifications', { isRead: statusFilter, type: typeFilter }],
    queryFn: () => apiClient.notifications.getAll({
      isRead: statusFilter ? statusFilter === 'true' : undefined,
      type: typeFilter || undefined,
    }),
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.notifications.markAllAsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Failed to mark notifications as read')
    },
  })

  const notifications = notificationsData?.data?.data?.notifications || []
  const unreadCount = notifications.filter((n: any) => !n.isRead).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated with important alerts and reminders
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            loading={markAllAsReadMutation.isPending}
            variant="outline"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="Filter by status"
        />
        
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          placeholder="Filter by type"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <NotificationList notifications={notifications} onRefetch={refetch} />
      )}
    </div>
  )
}
