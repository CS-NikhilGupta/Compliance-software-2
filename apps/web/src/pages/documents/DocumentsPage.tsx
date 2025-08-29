import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon, MagnifyingGlassIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DocumentTable } from '@/components/documents/DocumentTable'
import { UploadDocumentModal } from '@/components/documents/UploadDocumentModal'

const documentTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'COMPLIANCE_DOCUMENT', label: 'Compliance Document' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'AGREEMENT', label: 'Agreement' },
  { value: 'REPORT', label: 'Report' },
  { value: 'OTHER', label: 'Other' },
]

export function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Fetch clients for filter
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient.clients.getAll(),
  })

  const { data: documentsData, isLoading, refetch } = useQuery({
    queryKey: ['documents', { search: searchTerm, type: typeFilter, clientId: clientFilter }],
    queryFn: () => apiClient.documents.getAll({
      search: searchTerm,
      type: typeFilter || undefined,
      clientId: clientFilter || undefined,
    }),
  })

  const clients = clientsData?.data?.data?.clients || []
  const documents = documentsData?.data?.data?.documents || []

  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map((client: any) => ({ value: client.id, label: client.name }))
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and organize compliance documents and files
          </p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <CloudArrowUpIcon className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select
          options={clientOptions}
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          placeholder="Filter by client"
        />
        
        <Select
          options={documentTypeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          placeholder="Filter by type"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <DocumentTable documents={documents} onRefetch={refetch} />
      )}

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false)
          refetch()
        }}
      />
    </div>
  )
}
