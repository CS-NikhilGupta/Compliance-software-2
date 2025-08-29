import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface CreateClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreateClientFormData {
  name: string
  email: string
  phone?: string
  address?: string
  contactPerson: string
  gstNumber?: string
  panNumber?: string
}

export function CreateClientModal({ isOpen, onClose, onSuccess }: CreateClientModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateClientFormData>()

  const onSubmit = async (data: CreateClientFormData) => {
    try {
      setIsLoading(true)
      await apiClient.clients.create(data)
      toast.success('Client created successfully')
      reset()
      onSuccess()
    } catch (error) {
      toast.error('Failed to create client')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Client" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Client Name"
            {...register('name', {
              required: 'Client name is required',
              minLength: {
                value: 2,
                message: 'Client name must be at least 2 characters',
              },
            })}
            error={errors.name?.message}
            placeholder="Enter client name"
          />

          <Input
            label="Contact Person"
            {...register('contactPerson', {
              required: 'Contact person is required',
              minLength: {
                value: 2,
                message: 'Contact person must be at least 2 characters',
              },
            })}
            error={errors.contactPerson?.message}
            placeholder="Enter contact person name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            error={errors.email?.message}
            placeholder="Enter email address"
          />

          <Input
            label="Phone"
            type="tel"
            {...register('phone', {
              pattern: {
                value: /^[+]?[1-9][\d\s\-\(\)]{8,}$/,
                message: 'Invalid phone number',
              },
            })}
            error={errors.phone?.message}
            placeholder="Enter phone number"
          />
        </div>

        <Input
          label="Address"
          {...register('address')}
          error={errors.address?.message}
          placeholder="Enter client address"
        />

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Create Client
          </Button>
        </div>
      </form>
    </Modal>
  )
}
