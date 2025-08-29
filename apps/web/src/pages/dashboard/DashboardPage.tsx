import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { TaskChart } from '@/components/dashboard/TaskChart'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { UpcomingTasks } from '@/components/dashboard/UpcomingTasks'
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

export function DashboardPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.reports.getDashboard(),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const stats = dashboardData?.data?.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your compliance management activities
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Clients"
          value={stats?.overview?.totalClients || 0}
          icon={UsersIcon}
          color="blue"
        />
        <StatsCard
          title="Total Entities"
          value={stats?.overview?.totalEntities || 0}
          icon={BuildingOfficeIcon}
          color="green"
        />
        <StatsCard
          title="Pending Tasks"
          value={stats?.overview?.pendingTasks || 0}
          icon={ClipboardDocumentListIcon}
          color="yellow"
        />
        <StatsCard
          title="Overdue Tasks"
          value={stats?.overview?.overdueTasks || 0}
          icon={ExclamationTriangleIcon}
          color="red"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatsCard
          title="Completed This Month"
          value={stats?.overview?.completedTasksThisMonth || 0}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatsCard
          title="Upcoming Tasks"
          value={stats?.overview?.upcomingTasks || 0}
          icon={ClipboardDocumentListIcon}
          color="blue"
        />
        <StatsCard
          title="Total Documents"
          value={stats?.overview?.totalDocuments || 0}
          icon={DocumentTextIcon}
          color="purple"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskChart
          statusData={stats?.taskStatusDistribution || []}
          priorityData={stats?.taskPriorityDistribution || []}
          trendData={stats?.monthlyTrend || []}
        />
        <RecentActivity activities={stats?.recentActivities || []} />
      </div>

      {/* Upcoming Tasks */}
      <UpcomingTasks />
    </div>
  )
}
