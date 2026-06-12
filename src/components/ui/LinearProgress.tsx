interface LinearProgressProps {
  value?: number // 0 to 100, if undefined it is indeterminate
  className?: string
}

export default function LinearProgress({ value, className = '' }: LinearProgressProps) {
  const isIndeterminate = value === undefined

  return (
    <div className={`linear-progress ${className}`}>
      {isIndeterminate ? (
        <div className="linear-progress-indeterminate h-full" />
      ) : (
        <div
          className="linear-progress-bar h-full"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      )}
    </div>
  )
}
