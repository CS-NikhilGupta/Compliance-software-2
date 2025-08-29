import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

interface TaskChartProps {
  statusData: Array<{ status: string; count: number }>
  priorityData: Array<{ priority: string; count: number }>
  trendData: Array<{ month: string; completed: number }>
}

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#10b981',
  OVERDUE: '#ef4444',
  CANCELLED: '#6b7280',
}

const PRIORITY_COLORS = {
  LOW: '#6b7280',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
}

export function TaskChart({ statusData, priorityData, trendData }: TaskChartProps) {
  return (
    <div className="space-y-6">
      {/* Task Status Distribution */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Task Status Distribution</h3>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#8884d8'}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Task Priority Distribution */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Task Priority Distribution</h3>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6">
                {priorityData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS] || '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Completion Trend */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Monthly Completion Trend</h3>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
