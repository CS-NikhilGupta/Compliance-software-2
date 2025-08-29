import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-500',
}

export function StatsCard({ title, value, icon: Icon, color, change }: StatsCardProps) {
  return (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={cn('p-3 rounded-lg', colorClasses[color])}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change && (
                  <div
                    className={cn(
                      'ml-2 flex items-baseline text-sm font-semibold',
                      change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
