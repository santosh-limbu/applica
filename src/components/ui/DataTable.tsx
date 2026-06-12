import { type ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string | number
  onRowClick?: (item: T) => void
  className?: string
}

export default function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`data-table-container ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-6 text-tertiary">
                No data available
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'pointer' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
