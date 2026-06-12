import { Search, X } from 'lucide-react'
import Input from './Input'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchField({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchFieldProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        iconLeft={<Search size={16} />}
        className="w-full"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
