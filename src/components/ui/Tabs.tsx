export interface TabOption {
  id: string
  label: string
}

interface TabsProps {
  activeTab: string
  onChange: (id: string) => void
  tabs: TabOption[]
  variant?: 'line' | 'pill'
  className?: string
}

export default function Tabs({
  activeTab,
  onChange,
  tabs,
  variant = 'line',
  className = '',
}: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={`tab-pills ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-pill ${tab.id === activeTab ? 'tab-pill-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`tabs ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab ${tab.id === activeTab ? 'tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
