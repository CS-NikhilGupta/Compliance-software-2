import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EntityTable } from '@/components/entities/EntityTable'
import { CreateEntityModal } from '@/components/entities/CreateEntityModal'

const entityTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'PRIVATE_LIMITED', label: 'Private Limited' },
  { value: 'PUBLIC_LIMITED', label: 'Public Limited' },
  { value: 'LLP', label: 'LLP' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'PROPRIETORSHIP', label: 'Proprietorship' },
  { value: 'TRUST', label: 'Trust' },
  { value: 'SOCIETY', label: 'Society' },
  { value: 'OTHER', label: 'Other' },
]

export function EntitiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Fetch clients for filter
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient.clients.getAll(),
  })

  const { data: entitiesData, isLoading, refetch } = useQuery({
    queryKey: ['entities', { search: searchTerm, entityType: entityTypeFilter, clientId: clientFilter }],
    queryFn: () => apiClient.entities.getAll({
      search: searchTerm,
      entityType: entityTypeFilter || undefined,
      clientId: clientFilter || undefined,
    }),
  })

  const clients = clientsData?.data?.data?.clients || []
  const entities = entitiesData?.data?.data?.entities || []

  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map((client: any) => ({ value: client.id, label: client.name }))
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage client entities and their compliance requirements
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Entity
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search entities..."
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
          options={entityTypeOptions}
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          placeholder="Filter by type"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <EntityTable entities={entities} onRefetch={refetch} />
      )}

      {/* Create Entity Modal */}
      <CreateEntityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          refetch()
        }}
      />
    </div>
  )
}
