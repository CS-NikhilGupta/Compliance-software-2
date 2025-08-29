import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import { formatDate, formatCurrency } from '@/lib/utils'

interface ReportTableProps {
  data: any
  type: string
}

export function ReportTable({ data, type }: ReportTableProps) {
  if (!data) return null

  const renderTaskTable = () => {
    const tasks = data.tasks || []
    
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Task Details</h3>
        </div>
        <div className="card-content">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Completion Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task: any) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{task.client?.name || '-'}</TableCell>
                  <TableCell>
                    {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <span className={`badge ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(task.dueDate)}</TableCell>
                  <TableCell>{task.completedAt ? formatDate(task.completedAt) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const renderComplianceTable = () => {
    const compliances = data.compliances || []
    
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Compliance Summary</h3>
        </div>
        <div className="card-content">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compliance</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Active Tasks</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Avg. Days to Complete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compliances.map((compliance: any) => (
                <TableRow key={compliance.id}>
                  <TableCell className="font-medium">{compliance.title}</TableCell>
                  <TableCell>{compliance.category}</TableCell>
                  <TableCell>{compliance.periodicity}</TableCell>
                  <TableCell>{compliance.activeTasks}</TableCell>
                  <TableCell>{compliance.completionRate}%</TableCell>
                  <TableCell>{compliance.avgDaysToComplete}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const renderClientTable = () => {
    const clients = data.clients || []
    
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Client Performance</h3>
        </div>
        <div className="card-content">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Entities</TableHead>
                <TableHead>Total Tasks</TableHead>
                <TableHead>Completed Tasks</TableHead>
                <TableHead>Overdue Tasks</TableHead>
                <TableHead>Completion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client: any) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.entityCount}</TableCell>
                  <TableCell>{client.totalTasks}</TableCell>
                  <TableCell>{client.completedTasks}</TableCell>
                  <TableCell>{client.overdueTasks}</TableCell>
                  <TableCell>
                    <span className={`badge ${client.completionRate >= 80 ? 'badge-success' : client.completionRate >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                      {client.completionRate}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const renderPerformanceTable = () => {
    const users = data.users || []
    
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Team Performance</h3>
        </div>
        <div className="card-content">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Tasks</TableHead>
                <TableHead>Completed Tasks</TableHead>
                <TableHead>Avg. Completion Time</TableHead>
                <TableHead>Efficiency Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.assignedTasks}</TableCell>
                  <TableCell>{user.completedTasks}</TableCell>
                  <TableCell>{user.avgCompletionTime} days</TableCell>
                  <TableCell>
                    <span className={`badge ${user.efficiencyScore >= 80 ? 'badge-success' : user.efficiencyScore >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                      {user.efficiencyScore}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'badge-success'
      case 'IN_PROGRESS':
        return 'badge-primary'
      case 'OVERDUE':
        return 'badge-danger'
      default:
        return 'badge-secondary'
    }
  }

  switch (type) {
    case 'tasks':
      return renderTaskTable()
    case 'compliance':
      return renderComplianceTable()
    case 'client':
      return renderClientTable()
    case 'performance':
      return renderPerformanceTable()
    default:
      return renderTaskTable()
  }
}
