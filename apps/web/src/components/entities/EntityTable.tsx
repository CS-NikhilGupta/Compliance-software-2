import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import { formatDate, cn } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface Entity {
  id: string
  name: string
  entityType: string
  registrationNumber?: string
  panNumber?: string
  gstNumber?: string
  address?: string
  client: {
    id: string
    name: string
  }
  activeTasksCount: number
  createdAt: string
}

interface EntityTableProps {
  entities: Entity[]
  onRefetch: () => void
}

const entityTypeLabels: Record<string, string> = {
  PRIVATE_LIMITED: 'Private Limited',
  PUBLIC_LIMITED: 'Public Limited',
  LLP: 'LLP',
  PARTNERSHIP: 'Partnership',
  PROPRIETORSHIP: 'Proprietorship',
  TRUST: 'Trust',
  SOCIETY: 'Society',
  OTHER: 'Other',
}

export function EntityTable({ entities, onRefetch }: EntityTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (entityId: string) => {
    if (!confirm('Are you sure you want to delete this entity? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(entityId)
      await apiClient.entities.delete(entityId)
      toast.success('Entity deleted successfully')
      onRefetch()
    } catch (error) {
      toast.error('Failed to delete entity')
    } finally {
      setDeletingId(null)
    }
  }

  if (entities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No entities</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new entity.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Entity</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Registration</TableHead>
            <TableHead>GST/PAN</TableHead>
            <TableHead>Active Tasks</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entities.map((entity) => (
            <TableRow key={entity.id}>
              <TableCell>
                <div>
                  <Link
                    to={`/entities/${entity.id}`}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    {entity.name}
                  </Link>
                  {entity.address && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {entity.address}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Link
                  to={`/clients/${entity.client.id}`}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  {entity.client.name}
                </Link>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {entityTypeLabels[entity.entityType] || entity.entityType}
                </span>
              </TableCell>
              <TableCell>
                {entity.registrationNumber ? (
                  <div className="text-sm text-gray-900">{entity.registrationNumber}</div>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell>
                <div>
                  {entity.gstNumber && (
                    <div className="text-sm text-gray-900">GST: {entity.gstNumber}</div>
                  )}
                  {entity.panNumber && (
                    <div className="text-sm text-gray-500">PAN: {entity.panNumber}</div>
                  )}
                  {!entity.gstNumber && !entity.panNumber && (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {entity.activeTasksCount}
                </span>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">
                  {formatDate(entity.createdAt)}
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
                            to={`/entities/${entity.id}`}
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
                            to={`/entities/${entity.id}/edit`}
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
                            onClick={() => handleDelete(entity.id)}
                            disabled={deletingId === entity.id}
                            className={cn(
                              active ? 'bg-gray-100' : '',
                              'flex w-full items-center px-4 py-2 text-sm text-red-700 disabled:opacity-50'
                            )}
                          >
                            <TrashIcon className="mr-3 h-4 w-4" />
                            {deletingId === entity.id ? 'Deleting...' : 'Delete'}
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
