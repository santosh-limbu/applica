import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/app.store'
import { useProfileStore } from '@/stores/profile.store'
import AppShell from '@/components/layout/AppShell'

// Pages
import Welcome from '@/pages/Onboarding/Welcome'
import ApiKeySetup from '@/pages/Onboarding/ApiKeySetup'
import ProfileSetup from '@/pages/Onboarding/ProfileSetup'
import DashboardPage from '@/pages/Dashboard/DashboardPage'
import JobInput from '@/pages/NewApplication/JobInput'
import JobAnalysis from '@/pages/NewApplication/JobAnalysis'
import { EditorPage } from '@/pages/Editor/EditorPage'
import { CoverLetterPage } from '@/pages/CoverLetter/CoverLetterPage'

export default function App() {
  const currentPage = useAppStore((s) => s.currentPage)
  const navigate = useAppStore((s) => s.navigate)
  const loadProfile = useProfileStore((s) => s.loadProfile)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const firstRun = await window.api.isFirstRun()
        if (firstRun) {
          navigate('onboarding-welcome')
        } else {
          await loadProfile()
          navigate('dashboard')
        }
      } catch {
        navigate('dashboard')
      } finally {
        setReady(true)
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full" style={{ height: '100vh' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="btn-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <span className="text-secondary text-sm">Loading Applica…</span>
        </div>
      </div>
    )
  }

  // Onboarding pages render full-screen (no AppShell)
  const onboardingPages: Record<string, JSX.Element> = {
    'onboarding-welcome': <Welcome />,
    'onboarding-apikey': <ApiKeySetup />,
    'onboarding-profile': <ProfileSetup />,
  }

  if (onboardingPages[currentPage]) {
    return onboardingPages[currentPage]
  }

  // Regular pages render inside AppShell
  const pages: Record<string, JSX.Element> = {
    dashboard: <DashboardPage />,
    'new-application': <JobInput />,
    'job-analysis': <JobAnalysis />,
    editor: <EditorPage />,
    'cover-letter': <CoverLetterPage />,
  }

  return <AppShell>{pages[currentPage] ?? <DashboardPage />}</AppShell>
}
