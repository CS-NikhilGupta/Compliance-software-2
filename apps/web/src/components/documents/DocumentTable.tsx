import { useState } from 'react'
import { EllipsisVerticalIcon, TrashIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import { formatDate, formatFileSize, cn } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface Document {
  id: string
  name: string
  type: string
  fileSize: number
  mimeType: string
  filePath: string
  client?: {
    id: string
    name: string
  }
  entity?: {
    id: string
    name: string
  }
  task?: {
    id: string
    title: string
  }
  uploadedBy: {
    id: string
    firstName: string
    lastName: string
  }
  createdAt: string
}

interface DocumentTableProps {
  documents: Document[]
  onRefetch: () => void
}

const documentTypeLabels: Record<string, string> = {
  COMPLIANCE_DOCUMENT: 'Compliance Document',
  CERTIFICATE: 'Certificate',
  AGREEMENT: 'Agreement',
  REPORT: 'Report',
  OTHER: 'Other',
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('image')) return '🖼️'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📋'
  return '📁'
}

export function DocumentTable({ documents, onRefetch }: DocumentTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(documentId)
      await apiClient.documents.delete(documentId)
      toast.success('Document deleted successfully')
      onRefetch()
    } catch (error) {
      toast.error('Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      setDownloadingId(documentId)
      const response = await apiClient.documents.download(documentId)
      
      // Create blob and download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Document downloaded successfully')
    } catch (error) {
      toast.error('Failed to download document')
    } finally {
      setDownloadingId(null)
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by uploading a document.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Client/Entity</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(document.mimeType)}</span>
                  <div>
                    <div className="font-medium text-gray-900">{document.name}</div>
                    <div className="text-sm text-gray-500">{document.mimeType}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {documentTypeLabels[document.type] || document.type}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  {document.client && (
                    <div className="text-sm text-gray-900">{document.client.name}</div>
                  )}
                  {document.entity && (
                    <div className="text-sm text-gray-500">{document.entity.name}</div>
                  )}
                  {!document.client && !document.entity && (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {document.task ? (
                  <div className="text-sm text-primary-600 hover:text-primary-500">
                    {document.task.title}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-900">
                  {formatFileSize(document.fileSize)}
                </span>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">
                  {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">
                  {formatDate(document.createdAt)}
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
                          <button
                            onClick={() => handleDownload(document.id, document.name)}
                            disabled={downloadingId === document.id}
                            className={cn(
                              active ? 'bg-gray-100' : '',
                              'flex w-full items-center px-4 py-2 text-sm text-gray-700 disabled:opacity-50'
                            )}
                          >
                            <ArrowDownTrayIcon className="mr-3 h-4 w-4" />
                            {downloadingId === document.id ? 'Downloading...' : 'Download'}
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => handleDelete(document.id)}
                            disabled={deletingId === document.id}
                            className={cn(
                              active ? 'bg-gray-100' : '',
                              'flex w-full items-center px-4 py-2 text-sm text-red-700 disabled:opacity-50'
                            )}
                          >
                            <TrashIcon className="mr-3 h-4 w-4" />
                            {deletingId === document.id ? 'Deleting...' : 'Delete'}
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
