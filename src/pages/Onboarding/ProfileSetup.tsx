import { useState } from 'react'
import { ArrowLeft, Check, User, FileText, PenTool } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useProfileStore } from '@/stores/profile.store'
import type { Profile } from '@/types/ipc.types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

type Tab = 'personal' | 'summary' | 'writing' | 'references'

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'writing', label: 'Writing Sample', icon: PenTool },
  { id: 'references', label: 'References', icon: User },
]

export default function ProfileSetup() {
  const navigate = useAppStore((s) => s.navigate)
  const addToast = useAppStore((s) => s.addToast)
  const saveProfileToStore = useProfileStore((s) => s.saveProfile)
  const loadProfile = useProfileStore((s) => s.loadProfile)
  const profile = useProfileStore((s) => s.profile)

  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<Partial<Profile>>({
    id: undefined,
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    portfolio_url: '',
    professional_summary: '',
    writing_samples: '',
    references: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        id: profile.id,
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        linkedin_url: profile.linkedin_url || '',
        portfolio_url: profile.portfolio_url || '',
        professional_summary: profile.professional_summary || '',
        writing_samples: profile.writing_samples || '',
        references: profile.references || '',
      })
    }
  }, [profile])

  const update = (field: keyof Profile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleComplete = async () => {
    if (!form.full_name?.trim()) {
      addToast({ type: 'error', title: 'Name required', message: 'Please enter your full name' })
      setActiveTab('personal')
      return
    }

    setSaving(true)
    try {
      await saveProfileToStore(form as Profile)
      await window.api.setSettings('onboarding_complete', 'true')
      await loadProfile()
      addToast({ type: 'success', title: 'Profile created!', message: 'Welcome to Applica' })
      navigate('dashboard')
    } catch {
      addToast({ type: 'error', title: 'Save failed', message: 'Could not save your profile' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-bg" />

      <div className="onboarding-card" style={{ maxWidth: 580 }}>
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <StepIndicator current={3} total={4} />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Create Your Profile</h2>
          <p className="text-secondary text-sm">
            Tell us about yourself — this info powers your tailored CVs
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs mb-6">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                className={`tab flex items-center gap-2 ${activeTab === t.id ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <Card variant="surface" padding="lg" className="mb-6">
          {activeTab === 'personal' && (
            <div className="flex flex-col gap-5">
              <Input
                label="Full Name *"
                placeholder="John Doe"
                value={form.full_name}
                onChange={(e) => update('full_name', (e.target as HTMLInputElement).value)}
              />
              <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => update('email', (e.target as HTMLInputElement).value)}
                />
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={form.phone}
                  onChange={(e) => update('phone', (e.target as HTMLInputElement).value)}
                />
              </div>
              <Input
                label="Location"
                placeholder="San Francisco, CA"
                value={form.location}
                onChange={(e) => update('location', (e.target as HTMLInputElement).value)}
              />
              <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <Input
                  label="LinkedIn URL"
                  placeholder="linkedin.com/in/johndoe"
                  value={form.linkedin_url}
                  onChange={(e) => update('linkedin_url', (e.target as HTMLInputElement).value)}
                />
                <Input
                  label="Portfolio URL"
                  placeholder="johndoe.dev"
                  value={form.portfolio_url}
                  onChange={(e) => update('portfolio_url', (e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-tertiary">
                Write a brief professional summary — this will be adapted for each application.
              </p>
              <Input
                multiline
                placeholder="Experienced software engineer with 5+ years building scalable web applications. Passionate about clean code, user experience, and solving complex problems…"
                value={form.professional_summary}
                onChange={(e) =>
                  update('professional_summary', (e.target as HTMLTextAreaElement).value)
                }
                style={{ minHeight: 160 }}
              />
            </div>
          )}

          {activeTab === 'writing' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-tertiary">
                Paste a paragraph from a cover letter, email, or professional writing. This helps
                AI match your tone and style when generating content.
              </p>
              <Input
                multiline
                placeholder="Dear Hiring Manager, I'm excited to apply for the Software Engineer position at Acme Corp. With my background in full-stack development and a passion for building products that delight users…"
                value={form.writing_samples}
                onChange={(e) =>
                  update('writing_samples', (e.target as HTMLTextAreaElement).value)
                }
                style={{ minHeight: 160 }}
              />
              <p className="text-xs text-tertiary">
                This is optional but helps generate more authentic content.
              </p>
            </div>
          )}

          {activeTab === 'references' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-tertiary">
                Enter professional references (e.g. name, title, company, contact info) that you'd like to include on your CV, or write "References available upon request".
              </p>
              <Input
                multiline
                placeholder="e.g.&#10;Jane Smith&#10;Director of Engineering, Acme Corp&#10;Email: jane.smith@acme.com&#10;Phone: +1 (555) 987-6543"
                value={form.references}
                onChange={(e) =>
                  update('references', (e.target as HTMLTextAreaElement).value)
                }
                style={{ minHeight: 160 }}
              />
              <p className="text-xs text-tertiary">
                This is optional but helps format professional references if the job description or layout requires them.
              </p>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<ArrowLeft size={14} />}
            onClick={() => navigate('onboarding-linkedin')}
          >
            Back
          </Button>
          <Button
            size="md"
            loading={saving}
            iconRight={<Check size={16} />}
            onClick={handleComplete}
          >
            Complete Setup
          </Button>
        </div>

        <p className="text-xs text-tertiary text-center mt-4">
          Experience, education, and skills can be added later from the Profile page.
        </p>
      </div>
    </div>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
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
