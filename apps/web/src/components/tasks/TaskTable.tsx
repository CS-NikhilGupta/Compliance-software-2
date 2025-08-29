import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, EyeIcon, UserIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import { formatDate, getStatusColor, getPriorityIcon, cn } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate: string
  assignee?: {
    id: string
    firstName: string
    lastName: string
  }
  client?: {
    id: string
    name: string
  }
  entity?: {
    id: string
    name: string
  }
  compliance?: {
    id: string
    title: string
  }
  createdAt: string
}

interface TaskTableProps {
  tasks: Task[]
  onRefetch: () => void
}

export function TaskTable({ tasks, onRefetch }: TaskTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(taskId)
      await apiClient.tasks.delete(taskId)
      toast.success('Task deleted successfully')
      onRefetch()
    } catch (error) {
      toast.error('Failed to delete task')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      await apiClient.tasks.update(taskId, { status: newStatus })
      toast.success('Task status updated')
      onRefetch()
    } catch (error) {
      toast.error('Failed to update task status')
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Client/Entity</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <div>
                  <Link
                    to={`/tasks/${task.id}`}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    {task.title}
                  </Link>
                  {task.compliance && (
                    <div className="text-sm text-gray-500">
                      Compliance: {task.compliance.title}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  {task.client && (
                    <div className="text-sm text-gray-900">{task.client.name}</div>
                  )}
                  {task.entity && (
                    <div className="text-sm text-gray-500">{task.entity.name}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {task.assignee ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {task.assignee.firstName.charAt(0)}{task.assignee.lastName.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-900">
                      {task.assignee.firstName} {task.assignee.lastName}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                  className={`badge ${getStatusColor(task.status)} border-0 text-xs`}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                  <span className={`badge ${getStatusColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">
                  {formatDate(task.dueDate)}
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
                          <Link
                            to={`/tasks/${task.id}`}
                            className={cn(
                              active ? 'bg-gray-100' : '',
                              'flex items-center px-4 py-2 text-sm text-gray-700'
                            )}
                          >
                            <EyeIcon className="mr-3 h-4 w-4" />
                            View Details
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to={`/tasks/${task.id}/edit`}
                            className={cn(
                              active ? 'bg-gray-100' : '',
                              'flex items-center px-4 py-2 text-sm text-gray-700'
                            )}
                          >
                            <PencilIcon className="mr-3 h-4 w-4" />
                            Edit
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => handleDelete(task.id)}
                            disabled={deletingId === task.id}
                            className={cn(
                              active ? 'bg-gray-100' : '',
                              'flex w-full items-center px-4 py-2 text-sm text-red-700 disabled:opacity-50'
                            )}
                          >
                            <TrashIcon className="mr-3 h-4 w-4" />
                            {deletingId === task.id ? 'Deleting...' : 'Delete'}
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
