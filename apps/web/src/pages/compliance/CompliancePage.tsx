import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ComplianceTable } from '@/components/compliance/ComplianceTable'

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'CORPORATE', label: 'Corporate' },
  { value: 'TAX', label: 'Tax' },
  { value: 'LABOR', label: 'Labor' },
  { value: 'ENVIRONMENTAL', label: 'Environmental' },
  { value: 'REGULATORY', label: 'Regulatory' },
]

const periodicityOptions = [
  { value: '', label: 'All Frequencies' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half Yearly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'ONE_TIME', label: 'One Time' },
]

export function CompliancePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [periodicityFilter, setPeriodicityFilter] = useState('')

  const { data: compliancesData, isLoading } = useQuery({
    queryKey: ['compliances', { search: searchTerm, category: categoryFilter, periodicity: periodicityFilter }],
    queryFn: () => apiClient.compliances.getAll({
      search: searchTerm,
      category: categoryFilter || undefined,
      periodicity: periodicityFilter || undefined,
    }),
  })

  const compliances = compliancesData?.data?.data?.compliances || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Catalog</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and manage compliance requirements for Indian businesses
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search compliance requirements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select
          options={categoryOptions}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          placeholder="Filter by category"
        />
        
        <Select
          options={periodicityOptions}
          value={periodicityFilter}
          onChange={(e) => setPeriodicityFilter(e.target.value)}
          placeholder="Filter by frequency"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <ComplianceTable compliances={compliances} />
      )}
    </div>
  )
}
