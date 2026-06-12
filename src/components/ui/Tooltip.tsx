import { type ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  className?: string
}

export default function Tooltip({ content, children, className = '' }: TooltipProps) {
  return (
    <div className={`tooltip-wrapper ${className}`}>
      {children}
      <span className="tooltip">{content}</span>
    </div>
  )
}
