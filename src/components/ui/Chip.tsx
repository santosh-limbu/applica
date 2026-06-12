import { type ReactNode } from 'react'

interface ChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
  onDelete?: () => void
  icon?: ReactNode
  variant?: 'assist' | 'filter' | 'input' | 'suggestion' | 'success' | 'danger' | 'accent'
  className?: string
}

export default function Chip({
  label,
  selected = false,
  onClick,
  onDelete,
  icon,
  variant,
  className = '',
}: ChipProps) {
  let vClass = ''
  if (variant) {
    vClass = `chip-${variant}`
  } else if (selected) {
    vClass = 'chip-selected'
  }

  return (
    <span
      className={`chip ${vClass} ${onClick ? 'pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {icon && <span className="flex items-center mr-1">{icon}</span>}
      <span>{label}</span>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="ml-1 flex items-center justify-center rounded-full hover:bg-subtle"
          style={{ width: '16px', height: '16px', fontSize: '12px', lineHeight: 1 }}
        >
          &times;
        </button>
      )}
    </span>
  )
}
