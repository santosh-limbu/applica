import React from 'react'

interface StepIndicatorProps {
  current: number;
  total: number;
}

export default function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className={`step-dot ${
              i === current ? 'step-dot-active' : i < current ? 'step-dot-done' : ''
            }`}
          />
          {i < total - 1 && (
            <span className={`step-line ${i < current ? 'step-line-active' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
