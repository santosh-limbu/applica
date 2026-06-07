import { type ReactNode, useState } from 'react'
import { Settings } from 'lucide-react'
import ToastContainer from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'
import { SettingsPage } from '@/pages/Settings/SettingsPage'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="app-shell">
      <div className="app-content">
        {/* Titlebar drag region for the content area */}
        <div className="titlebar" />

        {/* Main scrollable content */}
        <main className="app-main">
          <div className="page-container">{children}</div>
        </main>
      </div>

      {/* Floating Settings Button in Bottom-Right Corner */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="settings-fab"
        aria-label="Settings"
      >
        <Settings size={22} />
      </button>

      {/* Settings Modal */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Settings"
        maxWidth="640px"
      >
        <SettingsPage />
      </Modal>

      <ToastContainer />
    </div>
  )
}
