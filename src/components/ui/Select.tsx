import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label?: string
  placeholder?: string
  className?: string
}

export default function Select({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select option',
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`input-group ${className}`} ref={containerRef}>
      {label && <label className="input-label">{label}</label>}
      <div className="select-wrapper">
        <button
          type="button"
          className="select-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="select-menu" role="listbox">
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`select-option ${opt.value === value ? 'select-option-selected' : ''}`}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
