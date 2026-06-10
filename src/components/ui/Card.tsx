import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  padding?: 'sm' | 'md' | 'lg' | 'none'
  hover?: boolean
  variant?: 'glass' | 'surface' | 'elevated'
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

const paddingClass: Record<string, string> = {
  none: '',
  sm: 'card-padding-sm',
  md: 'card-padding-md',
  lg: 'card-padding-lg',
}

const variantClass: Record<string, string> = {
  glass: '',
  surface: 'card-surface',
  elevated: 'card-elevated',
}

export default function Card({
  children,
  padding = 'md',
  hover = false,
  variant = 'glass',
  className = '',
  onClick,
  style,
}: CardProps) {
  return (
    <div
      className={`card ${paddingClass[padding]} ${variantClass[variant]} ${hover ? 'card-hover pointer' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  )
}
