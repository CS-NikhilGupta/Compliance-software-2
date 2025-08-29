import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreateTaskFormData {
  title: string
  description?: string
  priority: string
  dueDate: string
  clientId?: string
  entityId?: string
  complianceId?: string
  assigneeId?: string
}

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
]

export function CreateTaskModal({ isOpen, onClose, onSuccess }: CreateTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateTaskFormData>()

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

  // Fetch compliances
  const { data: compliancesData } = useQuery({
    queryKey: ['compliances'],
    queryFn: () => apiClient.compliances.getAll(),
    enabled: isOpen,
  })

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.users.getAll(),
    enabled: isOpen,
  })

  const clients = clientsData?.data?.data?.clients || []
  const entities = entitiesData?.data?.data?.entities || []
  const compliances = compliancesData?.data?.data?.compliances || []
  const users = usersData?.data?.data?.users || []

  const clientOptions = [
    { value: '', label: 'Select client (optional)' },
    ...clients.map((client: any) => ({ value: client.id, label: client.name }))
  ]

  const entityOptions = [
    { value: '', label: 'Select entity (optional)' },
    ...entities.map((entity: any) => ({ value: entity.id, label: entity.name }))
  ]

  const complianceOptions = [
    { value: '', label: 'Select compliance (optional)' },
    ...compliances.map((compliance: any) => ({ value: compliance.id, label: compliance.title }))
  ]

  const assigneeOptions = [
    { value: '', label: 'Assign to (optional)' },
    ...users.map((user: any) => ({ 
      value: user.id, 
      label: `${user.firstName} ${user.lastName}` 
    }))
  ]

  const onSubmit = async (data: CreateTaskFormData) => {
    try {
      setIsLoading(true)
      await apiClient.tasks.create({
        ...data,
        clientId: data.clientId || undefined,
        entityId: data.entityId || undefined,
        complianceId: data.complianceId || undefined,
        assigneeId: data.assigneeId || undefined,
      })
      toast.success('Task created successfully')
      reset()
      onSuccess()
    } catch (error) {
      toast.error('Failed to create task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Task" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Task Title"
          {...register('title', {
            required: 'Task title is required',
            minLength: {
              value: 3,
              message: 'Task title must be at least 3 characters',
            },
          })}
          error={errors.title?.message}
          placeholder="Enter task title"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Enter task description (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priority"
            options={priorityOptions}
            {...register('priority', {
              required: 'Priority is required',
            })}
            error={errors.priority?.message}
            placeholder="Select priority"
          />

          <Input
            label="Due Date"
            type="date"
            {...register('dueDate', {
              required: 'Due date is required',
            })}
            error={errors.dueDate?.message}
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

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Compliance"
            options={complianceOptions}
            {...register('complianceId')}
            error={errors.complianceId?.message}
          />

          <Select
            label="Assignee"
            options={assigneeOptions}
            {...register('assigneeId')}
            error={errors.assigneeId?.message}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  )
}
