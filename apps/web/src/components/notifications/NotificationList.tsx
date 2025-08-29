import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TrashIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/outline'
import { formatDateTime, cn } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  data?: Record<string, any>
  createdAt: string
}

interface NotificationListProps {
  notifications: Notification[]
  onRefetch: () => void
}

const notificationTypeLabels: Record<string, string> = {
  TASK_ASSIGNED: 'Task Assigned',
  TASK_DUE: 'Task Due',
  TASK_OVERDUE: 'Task Overdue',
  TASK_COMPLETED: 'Task Completed',
  MENTION: 'Mention',
  REMINDER: 'Reminder',
}

const notificationTypeIcons: Record<string, string> = {
  TASK_ASSIGNED: '👤',
  TASK_DUE: '⏰',
  TASK_OVERDUE: '🚨',
  TASK_COMPLETED: '✅',
  MENTION: '💬',
  REMINDER: '🔔',
}

const notificationTypeColors: Record<string, string> = {
  TASK_ASSIGNED: 'bg-blue-100 text-blue-800',
  TASK_DUE: 'bg-yellow-100 text-yellow-800',
  TASK_OVERDUE: 'bg-red-100 text-red-800',
  TASK_COMPLETED: 'bg-green-100 text-green-800',
  MENTION: 'bg-purple-100 text-purple-800',
  REMINDER: 'bg-gray-100 text-gray-800',
}

export function NotificationList({ notifications, onRefetch }: NotificationListProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => apiClient.notifications.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      onRefetch()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => apiClient.notifications.delete(notificationId),
    onSuccess: () => {
      toast.success('Notification deleted')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      onRefetch()
    },
    onError: () => {
      toast.error('Failed to delete notification')
    },
  })

  const handleMarkAsRead = async (notificationId: string) => {
    setProcessingIds(prev => new Set(prev).add(notificationId))
    try {
      await markAsReadMutation.mutateAsync(notificationId)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
    }
  }

  const handleDelete = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return
    }

    setProcessingIds(prev => new Set(prev).add(notificationId))
    try {
      await deleteMutation.mutateAsync(notificationId)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <ClockIcon className="h-12 w-12" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
        <p className="mt-1 text-sm text-gray-500">You're all caught up! No new notifications.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'card transition-all duration-200',
            !notification.isRead && 'ring-2 ring-primary-200 bg-primary-50'
          )}
        >
          <div className="card-content">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0">
                  <span className="text-2xl">
                    {notificationTypeIcons[notification.type] || '📢'}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      notificationTypeColors[notification.type] || 'bg-gray-100 text-gray-800'
                    )}>
                      {notificationTypeLabels[notification.type] || notification.type}
                    </span>
                    {!notification.isRead && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {notification.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="text-xs text-gray-500">
                    {formatDateTime(notification.createdAt)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {!notification.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsRead(notification.id)}
                    loading={processingIds.has(notification.id)}
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    Mark Read
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(notification.id)}
                  loading={processingIds.has(notification.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
