import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="overflow-x-auto">
      <table
        ref={ref}
        className={cn('min-w-full divide-y divide-gray-200', className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('bg-gray-50', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('bg-white divide-y divide-gray-200', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

const TableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn('hover:bg-gray-50 transition-colors', className)}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
}
