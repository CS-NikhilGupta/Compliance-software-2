import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface InviteUserFormData {
  firstName: string
  lastName: string
  email: string
  role: string
}

const roleOptions = [
  { value: 'USER', label: 'User' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMIN', label: 'Admin' },
]

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteUserFormData>({
    defaultValues: {
      role: 'USER',
    },
  })

  const onSubmit = async (data: InviteUserFormData) => {
    try {
      setIsLoading(true)
      await apiClient.users.invite(data)
      toast.success('User invitation sent successfully')
      reset()
      onSuccess()
    } catch (error) {
      toast.error('Failed to send user invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite New User" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            {...register('firstName', {
              required: 'First name is required',
              minLength: {
                value: 2,
                message: 'First name must be at least 2 characters',
              },
            })}
            error={errors.firstName?.message}
            placeholder="Enter first name"
          />

          <Input
            label="Last Name"
            {...register('lastName', {
              required: 'Last name is required',
              minLength: {
                value: 2,
                message: 'Last name must be at least 2 characters',
              },
            })}
            error={errors.lastName?.message}
            placeholder="Enter last name"
          />
        </div>

        <Input
          label="Email Address"
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

        <Select
          label="Role"
          options={roleOptions}
          {...register('role', {
            required: 'Role is required',
          })}
          error={errors.role?.message}
          placeholder="Select user role"
        />

        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-sm text-blue-700">
            An invitation email will be sent to the user with instructions to set up their account.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  )
}
