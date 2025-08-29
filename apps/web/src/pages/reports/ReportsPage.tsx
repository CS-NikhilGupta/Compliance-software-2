import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChartBarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ReportCharts } from '@/components/reports/ReportCharts'
import { ReportTable } from '@/components/reports/ReportTable'

const reportTypeOptions = [
  { value: 'tasks', label: 'Task Reports' },
  { value: 'compliance', label: 'Compliance Reports' },
  { value: 'client', label: 'Client Reports' },
  { value: 'performance', label: 'Performance Reports' },
]

const periodOptions = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
]

export function ReportsPage() {
  const [reportType, setReportType] = useState('tasks')
  const [period, setPeriod] = useState('month')

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', reportType, { period }],
    queryFn: () => {
      switch (reportType) {
        case 'tasks':
          return apiClient.reports.getTaskReport({ period })
        case 'compliance':
          return apiClient.reports.getComplianceReport({ period })
        case 'client':
          return apiClient.reports.getClientReport({ period })
        case 'performance':
          return apiClient.reports.getPerformanceReport({ period })
        default:
          return apiClient.reports.getTaskReport({ period })
      }
    },
  })

  const handleExportReport = async () => {
    try {
      // This would typically generate and download a PDF/Excel report
      // For now, we'll just show a success message
      console.log('Exporting report...', { reportType, period })
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate insights and track performance across your compliance activities
          </p>
        </div>
        <Button onClick={handleExportReport} variant="outline">
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select
          label="Report Type"
          options={reportTypeOptions}
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        />
        
        <Select
          label="Time Period"
          options={periodOptions}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <ReportCharts data={reportData?.data?.data} type={reportType} />
          <ReportTable data={reportData?.data?.data} type={reportType} />
        </div>
      )}
    </div>
  )
}
