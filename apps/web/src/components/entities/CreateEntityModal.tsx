import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface CreateEntityModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreateEntityFormData {
  name: string
  entityType: string
  clientId: string
  registrationNumber?: string
  panNumber?: string
  gstNumber?: string
  address?: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
}

const entityTypeOptions = [
  { value: 'PRIVATE_LIMITED', label: 'Private Limited' },
  { value: 'PUBLIC_LIMITED', label: 'Public Limited' },
  { value: 'LLP', label: 'LLP' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'PROPRIETORSHIP', label: 'Proprietorship' },
  { value: 'TRUST', label: 'Trust' },
  { value: 'SOCIETY', label: 'Society' },
  { value: 'OTHER', label: 'Other' },
]

export function CreateEntityModal({ isOpen, onClose, onSuccess }: CreateEntityModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateEntityFormData>()

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient.clients.getAll(),
    enabled: isOpen,
  })

  const clients = clientsData?.data?.data?.clients || []
  const clientOptions = clients.map((client: any) => ({ 
    value: client.id, 
    label: client.name 
  }))

  const onSubmit = async (data: CreateEntityFormData) => {
    try {
      setIsLoading(true)
      await apiClient.entities.create(data)
      toast.success('Entity created successfully')
      reset()
      onSuccess()
    } catch (error) {
      toast.error('Failed to create entity')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Entity" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Entity Name"
            {...register('name', {
              required: 'Entity name is required',
              minLength: {
                value: 2,
                message: 'Entity name must be at least 2 characters',
              },
            })}
            error={errors.name?.message}
            placeholder="Enter entity name"
          />

          <Select
            label="Entity Type"
            options={entityTypeOptions}
            {...register('entityType', {
              required: 'Entity type is required',
            })}
            error={errors.entityType?.message}
            placeholder="Select entity type"
          />
        </div>

        <Select
          label="Client"
          options={clientOptions}
          {...register('clientId', {
            required: 'Client is required',
          })}
          error={errors.clientId?.message}
          placeholder="Select client"
        />

        <Input
          label="Address"
          {...register('address')}
          error={errors.address?.message}
          placeholder="Enter entity address"
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Registration Number"
            {...register('registrationNumber')}
            error={errors.registrationNumber?.message}
            placeholder="Registration no."
          />

          <Input
            label="PAN Number"
            {...register('panNumber', {
              pattern: {
                value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                message: 'Invalid PAN number format',
              },
            })}
            error={errors.panNumber?.message}
            placeholder="ABCDE1234F"
          />

          <Input
            label="GST Number"
            {...register('gstNumber', {
              pattern: {
                value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                message: 'Invalid GST number format',
              },
            })}
            error={errors.gstNumber?.message}
            placeholder="22AAAAA0000A1Z5"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Contact Person"
            {...register('contactPerson')}
            error={errors.contactPerson?.message}
            placeholder="Contact person name"
          />

          <Input
            label="Contact Email"
            type="email"
            {...register('contactEmail', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            error={errors.contactEmail?.message}
            placeholder="contact@entity.com"
          />

          <Input
            label="Contact Phone"
            type="tel"
            {...register('contactPhone', {
              pattern: {
                value: /^[+]?[1-9][\d\s\-\(\)]{8,}$/,
                message: 'Invalid phone number',
              },
            })}
            error={errors.contactPhone?.message}
            placeholder="+91 98765 43210"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Create Entity
          </Button>
        </div>
      </form>
    </Modal>
  )
}
