import { type ReactNode } from 'react'
import Sidebar from './Sidebar'
import ToastContainer from '@/components/ui/Toast'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        {/* Titlebar drag region for the content area */}
        <div className="titlebar" />

        {/* Main scrollable content */}
        <main className="app-main">
          <div className="page-container">{children}</div>
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
