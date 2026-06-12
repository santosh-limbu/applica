import { type ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`page-header flex items-center justify-between ${className}`}>
      <div>
        <h2 className="page-title">{title}</h2>
        {subtitle && <p className="page-subtitle mt-0-5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
