import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { formatDate, getStatusColor, getPriorityIcon } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CalendarIcon, UserIcon } from '@heroicons/react/24/outline'

export function UpcomingTasks() {
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', { status: 'PENDING,IN_PROGRESS', limit: 5, sortBy: 'dueDate' }],
    queryFn: () => apiClient.tasks.getAll({
      status: 'PENDING,IN_PROGRESS',
      limit: 5,
      sortBy: 'dueDate',
      sortOrder: 'asc',
    }),
  })

  const tasks = tasksData?.data?.data?.tasks || []

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="card-title">Upcoming Tasks</h3>
            <p className="card-description">Tasks due soon that need attention</p>
          </div>
          <Link
            to="/tasks"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View all
          </Link>
        </div>
      </div>
      <div className="card-content">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No upcoming tasks
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task: any) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate"
                    >
                      {task.title}
                    </Link>
                    <span className={`badge badge-sm ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    {task.client && (
                      <div className="flex items-center space-x-1">
                        <UserIcon className="h-3 w-3" />
                        <span>{task.client.name}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>Due {formatDate(task.dueDate)}</span>
                    </div>
                    {task.assignee && (
                      <div className="flex items-center space-x-1">
                        <span>Assigned to {task.assignee.firstName} {task.assignee.lastName}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <div className={`badge ${getStatusColor(task.priority)}`}>
                    {task.priority}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
