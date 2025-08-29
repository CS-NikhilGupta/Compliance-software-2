import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { formatDate, cn } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  contactPerson: string
  gstNumber?: string
  panNumber?: string
  entityCount: number
  activeTasksCount: number
  createdAt: string
  updatedAt: string
}

interface ClientTableProps {
  clients: Client[]
  onRefetch: () => void
}

export function ClientTable({ clients, onRefetch }: ClientTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(clientId)
      await apiClient.clients.delete(clientId)
      toast.success('Client deleted successfully')
      onRefetch()
    } catch (error) {
      toast.error('Failed to delete client')
    } finally {
      setDeletingId(null)
    }
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new client.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>GST/PAN</TableHead>
            <TableHead>Entities</TableHead>
            <TableHead>Active Tasks</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <div>
                  <Link
                    to={`/clients/${client.id}`}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    {client.name}
                  </Link>
                  <div className="text-sm text-gray-500">{client.contactPerson}</div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="text-sm text-gray-900">{client.email}</div>
                  {client.phone && (
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  {client.gstNumber && (
                    <div className="text-sm text-gray-900">GST: {client.gstNumber}</div>
                  )}
                  {client.panNumber && (
                    <div className="text-sm text-gray-500">PAN: {client.panNumber}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {client.entityCount}
                </span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {client.activeTasksCount}
                </span>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">
                  {formatDate(client.createdAt)}
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
                            to={`/clients/${client.id}`}
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
                            to={`/clients/${client.id}/edit`}
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
                            onClick={() => handleDelete(client.id)}
                            disabled={deletingId === client.id}
                            className={cn(
                              active ? 'bg-gray-100' : '',
                              'flex w-full items-center px-4 py-2 text-sm text-red-700 disabled:opacity-50'
                            )}
                          >
                            <TrashIcon className="mr-3 h-4 w-4" />
                            {deletingId === client.id ? 'Deleting...' : 'Delete'}
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
