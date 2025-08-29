import { Link } from 'react-router-dom'
import { EyeIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Compliance {
  id: string
  title: string
  description?: string
  category: string
  periodicity: string
  daysBeforeDue: number
  penaltyAmount?: number
  applicableEntityTypes: string[]
  isActive: boolean
}

interface ComplianceTableProps {
  compliances: Compliance[]
}

const categoryLabels: Record<string, string> = {
  CORPORATE: 'Corporate',
  TAX: 'Tax',
  LABOR: 'Labor',
  ENVIRONMENTAL: 'Environmental',
  REGULATORY: 'Regulatory',
}

const periodicityLabels: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half Yearly',
  YEARLY: 'Yearly',
  ONE_TIME: 'One Time',
}

const categoryColors: Record<string, string> = {
  CORPORATE: 'bg-blue-100 text-blue-800',
  TAX: 'bg-green-100 text-green-800',
  LABOR: 'bg-yellow-100 text-yellow-800',
  ENVIRONMENTAL: 'bg-purple-100 text-purple-800',
  REGULATORY: 'bg-red-100 text-red-800',
}

export function ComplianceTable({ compliances }: ComplianceTableProps) {
  if (compliances.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <DocumentTextIcon className="h-12 w-12" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No compliance requirements</h3>
        <p className="mt-1 text-sm text-gray-500">No compliance requirements match your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Compliance Requirement</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Notice Period</TableHead>
            <TableHead>Penalty</TableHead>
            <TableHead>Entity Types</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {compliances.map((compliance) => (
            <TableRow key={compliance.id}>
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">{compliance.title}</div>
                  {compliance.description && (
                    <div className="text-sm text-gray-500 mt-1 max-w-md truncate">
                      {compliance.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  categoryColors[compliance.category] || 'bg-gray-100 text-gray-800'
                )}>
                  {categoryLabels[compliance.category] || compliance.category}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {periodicityLabels[compliance.periodicity] || compliance.periodicity}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-900">
                  {compliance.daysBeforeDue} days
                </span>
              </TableCell>
              <TableCell>
                {compliance.penaltyAmount ? (
                  <span className="text-sm text-red-600 font-medium">
                    ₹{compliance.penaltyAmount.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {compliance.applicableEntityTypes.slice(0, 2).map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {type.replace('_', ' ')}
                    </span>
                  ))}
                  {compliance.applicableEntityTypes.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{compliance.applicableEntityTypes.length - 2} more
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  compliance.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                )}>
                  {compliance.isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell>
                <Link
                  to={`/compliance/${compliance.id}`}
                  className="text-primary-600 hover:text-primary-500"
                >
                  <EyeIcon className="h-5 w-5" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
