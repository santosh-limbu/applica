import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  active?: boolean
  variant?: 'standard' | 'filled' | 'filledTonal' | 'outlined'
  className?: string
}

export default function IconButton({
  children,
  active = false,
  variant = 'standard',
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-btn ${active ? 'icon-btn-active' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
