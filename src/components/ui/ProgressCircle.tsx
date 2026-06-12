import { HTMLAttributes } from 'react'

interface ProgressCircleProps extends HTMLAttributes<HTMLDivElement> {
  progress: number
  size?: number
  strokeWidth?: number
  showValue?: boolean
  glow?: boolean
}

export default function ProgressCircle({
  progress,
  size = 90,
  strokeWidth = 6,
  showValue = true,
  glow = true,
  className = '',
  ...props
}: ProgressCircleProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress))
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        className="transform -rotate-90"
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id="progress-circle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-primary)" />
            <stop offset="100%" stopColor="var(--accent-secondary)" />
          </linearGradient>
        </defs>

        {/* Outer subtle decoration ring */}
        <circle
          cx={center}
          cy={center}
          r={radius + 3}
          fill="transparent"
          stroke="var(--border-subtle)"
          strokeWidth="0.5"
          strokeDasharray="3 3"
          className="animate-spin-slow"
        />

        {/* Track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="var(--border-default)"
          strokeWidth={strokeWidth}
        />

        {/* Glow circle underneath */}
        {glow && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="url(#progress-circle-gradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            opacity="0.45"
            style={{
              filter: 'blur(4px)',
              transition: 'stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}

        {/* Fill circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="url(#progress-circle-gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {/* Inner subtle decoration ring */}
        <circle
          cx={center}
          cy={center}
          r={radius - strokeWidth - 1}
          fill="transparent"
          stroke="var(--border-subtle)"
          strokeWidth="0.5"
        />
      </svg>

      {/* Percentage text */}
      {showValue && (
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-base font-bold text-primary tracking-tight">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
    </div>
  )
}
