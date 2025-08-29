import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr = 'MMM dd, yyyy') {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return 'Invalid date'
    return format(dateObj, formatStr)
  } catch {
    return 'Invalid date'
  }
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, 'MMM dd, yyyy HH:mm')
}

export function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-IN').format(num)
}

export function getInitials(firstName: string, lastName?: string) {
  if (!firstName) return '??'
  if (!lastName) return firstName.charAt(0).toUpperCase()
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function getStatusColor(status: string) {
  const statusColors: Record<string, string> = {
    // Task statuses
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    
    // Priority levels
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
    
    // Entity types
    INDIVIDUAL: 'bg-purple-100 text-purple-800',
    PROPRIETORSHIP: 'bg-blue-100 text-blue-800',
    PARTNERSHIP: 'bg-green-100 text-green-800',
    LLP: 'bg-indigo-100 text-indigo-800',
    PRIVATE_LIMITED: 'bg-red-100 text-red-800',
    PUBLIC_LIMITED: 'bg-pink-100 text-pink-800',
    
    // Default
    default: 'bg-gray-100 text-gray-800',
  }
  
  return statusColors[status] || statusColors.default
}

export function getPriorityIcon(priority: string) {
  const icons: Record<string, string> = {
    LOW: '🔵',
    MEDIUM: '🟡',
    HIGH: '🟠',
    CRITICAL: '🔴',
  }
  return icons[priority] || '⚪'
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}
