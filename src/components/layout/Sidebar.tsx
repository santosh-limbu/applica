import {
  LayoutDashboard,
  Settings,
  Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useProfileStore } from '@/stores/profile.store'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

export default function Sidebar() {
  const currentPage = useAppStore((s) => s.currentPage)
  const navigate = useAppStore((s) => s.navigate)
  const profile = useProfileStore((s) => s.profile)

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  let version = ''
  try {
    version = window.api.getAppVersion()
  } catch {
    version = '1.0.0'
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-header titlebar">
        <Sparkles size={22} style={{ color: 'var(--accent-primary)' }} />
        <span className="sidebar-brand titlebar-nodrag">Applica</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <Icon size={20} className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar">{initials}</div>
        <div className="flex-col" style={{ minWidth: 0 }}>
          <span className="text-sm font-medium truncate">
            {profile?.full_name || 'No profile'}
          </span>
          <span className="sidebar-version">v{version}</span>
        </div>
      </div>
    </aside>
  )
}
