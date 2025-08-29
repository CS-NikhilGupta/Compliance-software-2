import { formatDateTime } from '@/lib/utils'

interface Activity {
  id: string
  action: string
  entityType: string
  user: string
  createdAt: string
}

interface RecentActivityProps {
  activities: Activity[]
}

const actionLabels: Record<string, string> = {
  CLIENT_CREATED: 'Created client',
  CLIENT_UPDATED: 'Updated client',
  ENTITY_CREATED: 'Created entity',
  ENTITY_UPDATED: 'Updated entity',
  TASK_CREATED: 'Created task',
  TASK_UPDATED: 'Updated task',
  TASK_COMPLETED: 'Completed task',
  DOCUMENT_UPLOADED: 'Uploaded document',
  USER_INVITED: 'Invited user',
  USER_CREATED: 'Created user',
}

const getActionIcon = (action: string) => {
  if (action.includes('CREATED')) return '➕'
  if (action.includes('UPDATED')) return '✏️'
  if (action.includes('COMPLETED')) return '✅'
  if (action.includes('UPLOADED')) return '📄'
  if (action.includes('INVITED')) return '👥'
  return '📝'
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Recent Activity</h3>
        <p className="card-description">Latest actions in your organization</p>
      </div>
      <div className="card-content">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span>{' '}
                    {actionLabels[activity.action] || activity.action.toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
