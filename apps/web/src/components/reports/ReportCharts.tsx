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

interface ReportChartsProps {
  data: any
  type: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function ReportCharts({ data, type }: ReportChartsProps) {
  if (!data) return null

  const renderTaskCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Task Status Distribution */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Task Status Distribution</h3>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.statusDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(data.statusDistribution || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Task Completion Trend */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Task Completion Trend</h3>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.completionTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderComplianceCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Compliance by Category */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Compliance by Category</h3>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.categoryDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Compliance Status</h3>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.statusDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(data.statusDistribution || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderClientCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Clients by Tasks */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Top Clients by Task Volume</h3>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topClients || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="taskCount" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Client Growth */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Client Growth</h3>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.clientGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="newClients"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderPerformanceCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Team Performance */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Team Performance</h3>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.teamPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completedTasks" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Trend */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Performance Trend</h3>
        </div>
        <div className="card-content">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.performanceTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#f59e0b"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  switch (type) {
    case 'tasks':
      return renderTaskCharts()
    case 'compliance':
      return renderComplianceCharts()
    case 'client':
      return renderClientCharts()
    case 'performance':
      return renderPerformanceCharts()
    default:
      return renderTaskCharts()
  }
}
