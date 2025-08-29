import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface ForgotPasswordFormData {
  email: string
}

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>()

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true)
      await apiClient.auth.forgotPassword(data.email)
      setEmailSent(true)
      toast.success('Password reset email sent successfully')
    } catch (error) {
      toast.error('Failed to send password reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Check your email</h2>
        <p className="mt-2 text-sm text-gray-600">
          We've sent a password reset link to your email address.
        </p>
        <div className="mt-6">
          <Link
            to="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Forgot your password?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              autoComplete="email"
              className="input"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-lg w-full flex justify-center"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </div>
      </form>

      <div className="text-center">
        <Link
          to="/auth/login"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
