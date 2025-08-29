import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface UploadDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface UploadDocumentFormData {
  name: string
  type: string
  clientId?: string
  entityId?: string
  taskId?: string
}

const documentTypeOptions = [
  { value: 'COMPLIANCE_DOCUMENT', label: 'Compliance Document' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'AGREEMENT', label: 'Agreement' },
  { value: 'REPORT', label: 'Report' },
  { value: 'OTHER', label: 'Other' },
]

export function UploadDocumentModal({ isOpen, onClose, onSuccess }: UploadDocumentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UploadDocumentFormData>()

  const selectedClientId = watch('clientId')

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient.clients.getAll(),
    enabled: isOpen,
  })

  // Fetch entities for selected client
  const { data: entitiesData } = useQuery({
    queryKey: ['entities', selectedClientId],
    queryFn: () => apiClient.entities.getAll({ clientId: selectedClientId }),
    enabled: isOpen && !!selectedClientId,
  })

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiClient.tasks.getAll({ limit: 100 }),
    enabled: isOpen,
  })

  const clients = clientsData?.data?.data?.clients || []
  const entities = entitiesData?.data?.data?.entities || []
  const tasks = tasksData?.data?.data?.tasks || []

  const clientOptions = [
    { value: '', label: 'Select client (optional)' },
    ...clients.map((client: any) => ({ value: client.id, label: client.name }))
  ]

  const entityOptions = [
    { value: '', label: 'Select entity (optional)' },
    ...entities.map((entity: any) => ({ value: entity.id, label: entity.name }))
  ]

  const taskOptions = [
    { value: '', label: 'Select task (optional)' },
    ...tasks.map((task: any) => ({ value: task.id, label: task.title }))
  ]

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
  }

  const onSubmit = async (data: UploadDocumentFormData) => {
    if (!selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    try {
      setIsLoading(true)
      
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', data.name)
      formData.append('type', data.type)
      
      if (data.clientId) formData.append('clientId', data.clientId)
      if (data.entityId) formData.append('entityId', data.entityId)
      if (data.taskId) formData.append('taskId', data.taskId)

      await apiClient.documents.upload(formData)
      toast.success('Document uploaded successfully')
      reset()
      setSelectedFile(null)
      onSuccess()
    } catch (error) {
      toast.error('Failed to upload document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedFile(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Document" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, DOC, XLS, PPT, JPG, PNG up to 10MB
              </p>
              {selectedFile && (
                <p className="text-sm text-green-600 font-medium">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Document Name"
            {...register('name', {
              required: 'Document name is required',
              minLength: {
                value: 2,
                message: 'Document name must be at least 2 characters',
              },
            })}
            error={errors.name?.message}
            placeholder="Enter document name"
          />

          <Select
            label="Document Type"
            options={documentTypeOptions}
            {...register('type', {
              required: 'Document type is required',
            })}
            error={errors.type?.message}
            placeholder="Select document type"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Client"
            options={clientOptions}
            {...register('clientId')}
            error={errors.clientId?.message}
          />

          <Select
            label="Entity"
            options={entityOptions}
            {...register('entityId')}
            error={errors.entityId?.message}
            disabled={!selectedClientId}
          />
        </div>

        <Select
          label="Related Task"
          options={taskOptions}
          {...register('taskId')}
          error={errors.taskId?.message}
        />

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} disabled={!selectedFile}>
            Upload Document
          </Button>
        </div>
      </form>
    </Modal>
  )
}
